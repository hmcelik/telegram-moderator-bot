/**
 * @fileoverview Manages all interactions with the SQLite database.
 * This includes initializing the database, managing tables for settings,
 * user strikes, audit logs, and whitelisted keywords.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from './logger.js';

// The database connection object.
let db;

/**
 * Initializes the database connection and creates tables if they do not exist.
 * This function must be called at application startup.
 */
export const initDb = async (isTest = false) => {
    // If the database connection is already open, simply ensure the tables exist.
    if (!db) {
        const dbPath = isTest ? ':memory:' : (process.env.DATABASE_PATH || './moderator.db');
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
    }

    await db.exec(`
        -- Stores every chat the bot is a member of.
        CREATE TABLE IF NOT EXISTS groups (
            chatId TEXT PRIMARY KEY,
            chatTitle TEXT NOT NULL
        );
        -- Stores permanent user information for lookup.
        CREATE TABLE IF NOT EXISTS users (
            userId TEXT PRIMARY KEY,
            username TEXT,
            firstName TEXT,
            lastName TEXT
        );
        -- Stores the number of strikes for each user per group.
        CREATE TABLE IF NOT EXISTS strikes (
            chatId TEXT NOT NULL,
            userId TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            timestamp TEXT,
            PRIMARY KEY (chatId, userId)
        );
        -- Logs every moderation action (deletion, penalty).
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            chatId TEXT NOT NULL,
            userId TEXT NOT NULL,
            logData TEXT NOT NULL
        );
        -- Stores all dynamic configuration settings for the bot per group.
        CREATE TABLE IF NOT EXISTS settings (
            chatId TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (chatId, key)
        );
        -- Stores whitelisted keywords that bypass AI spam checks per group.
        CREATE TABLE IF NOT EXISTS keyword_whitelist (
            chatId TEXT NOT NULL,
            keyword TEXT NOT NULL COLLATE NOCASE,
            PRIMARY KEY (chatId, keyword)
        );
    `);
    if (!isTest) {
        logger.info('Database initialized successfully.');
    }
};

/**
 * Injects a database connection object. Used for testing purposes.
 * @param {object} dbConnection - The database connection object from sqlite.open().
 */
export const setDb = (dbConnection) => {
    db = dbConnection;
};

// --- User Management ---

export const upsertUser = (user) => {
    if (!user || !user.id) return;
    return db.run(
        `INSERT INTO users (userId, username, firstName, lastName) VALUES (?, ?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
         username = excluded.username,
         firstName = excluded.firstName,
         lastName = excluded.lastName`,
        user.id.toString(), user.username, user.first_name, user.last_name
    );
};

export const findUserByUsernameInDb = (username) => {
    if (!username) return null;
    return db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', username);
};


// --- Group Management ---

export const addGroup = (chatId, chatTitle) => {
    return db.run('INSERT OR REPLACE INTO groups (chatId, chatTitle) VALUES (?, ?)', chatId, chatTitle);
};

export const removeGroup = (chatId) => {
    return db.run('DELETE FROM groups WHERE chatId = ?', chatId);
};

export const getAllGroups = () => {
    return db.all('SELECT * FROM groups');
};

export const getGroup = (chatId) => {
    return db.get('SELECT * FROM groups WHERE chatId = ?', chatId);
};


// --- Keyword Whitelist Logic ---

export const addWhitelistKeyword = (chatId, keyword) => {
    return db.run('INSERT OR IGNORE INTO keyword_whitelist (chatId, keyword) VALUES (?, ?)', chatId, keyword);
};

export const removeWhitelistKeyword = (chatId, keyword) => {
    return db.run('DELETE FROM keyword_whitelist WHERE chatId = ? AND keyword = ?', chatId, keyword);
};

export const getWhitelistKeywords = async (chatId) => {
    const rows = await db.all('SELECT keyword FROM keyword_whitelist WHERE chatId = ?', chatId);
    return rows.map(row => row.keyword);
};


// --- Strike and Audit Logic ---

export const recordStrike = async (chatId, userId, logData) => {
    await db.run('BEGIN TRANSACTION');
    try {
        await db.run(
            'INSERT INTO strikes (chatId, userId, count, timestamp) VALUES (?, ?, 1, ?) ON CONFLICT(chatId, userId) DO UPDATE SET count = count + 1, timestamp = ?',
            chatId,
            userId,
            new Date().toISOString(),
            new Date().toISOString()
        );
        await db.run(
            'INSERT INTO audit_log (timestamp, chatId, userId, logData) VALUES (?, ?, ?, ?)',
            logData.timestamp,
            chatId,
            userId,
            JSON.stringify(logData)
        );
        await db.run('COMMIT');

        const { count } = await getStrikes(chatId, userId);
        return count;
    } catch (error) {
        await db.run('ROLLBACK');
        logger.error('Failed to record strike in transaction', error);
        throw error;
    }
};

export const logManualAction = (chatId, userId, logData) => {
    return db.run(
        'INSERT INTO audit_log (timestamp, chatId, userId, logData) VALUES (?, ?, ?, ?)',
        new Date().toISOString(),
        chatId,
        userId,
        JSON.stringify(logData)
    );
};

export const getStrikes = async (chatId, userId) => {
    await recalculateStrikes(chatId, userId);
    return await db.get('SELECT count, timestamp FROM strikes WHERE chatId = ? AND userId = ?', chatId, userId) || { count: 0, timestamp: null };
};

export const resetStrikes = (chatId, userId) => {
    return db.run('UPDATE strikes SET count = 0, timestamp = NULL WHERE chatId = ? AND userId = ?', chatId, userId);
};

export const addStrikes = async (chatId, userId, amount) => {
    await db.run(
        `INSERT INTO strikes (chatId, userId, count) VALUES (?, ?, ?)
         ON CONFLICT(chatId, userId) DO UPDATE SET count = count + excluded.count`,
        chatId, userId, amount
    );
    const { count } = await getStrikes(chatId, userId);
    return count;
};

export const removeStrike = async (chatId, userId, amount) => {
    const currentStrikes = await getStrikes(chatId, userId);
    if (currentStrikes.count === 0) return 0;
    const newCount = Math.max(0, currentStrikes.count - amount);
    await db.run('UPDATE strikes SET count = ? WHERE chatId = ? AND userId = ?', newCount, chatId, userId);
    return newCount;
};

export const setStrikes = async (chatId, userId, amount) => {
    // Only set a timestamp if the user has no strikes and is being given one or more.
    // Otherwise, the timestamp of the original offense is preserved.
    await db.run(
        `INSERT INTO strikes (chatId, userId, count, timestamp)
         VALUES (?, ?, ?, CASE WHEN ? > 0 THEN ? ELSE NULL END)
         ON CONFLICT(chatId, userId) DO UPDATE SET count = excluded.count`,
        chatId, userId, amount, amount, new Date().toISOString()
    );
    const { count } = await getStrikes(chatId, userId);
    return count;
};

export const getTotalDeletionsToday = async (chatId) => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`SELECT COUNT(*) as count FROM audit_log WHERE chatId = ? AND date(timestamp) = ?`, chatId, today);
    return result?.count || 0;
};

export const getAuditLog = (chatId, limit = 15) => {
    return db.all('SELECT * FROM audit_log WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?', chatId, limit);
};

export const getStrikeHistory = (chatId, userId, limit = 10) => {
    return db.all('SELECT * FROM audit_log WHERE chatId = ? AND userId = ? ORDER BY timestamp DESC LIMIT ?', chatId, userId, limit);
};

// --- Settings Logic ---

export const getSetting = async (chatId, key, defaultValue) => {
    const row = await db.get('SELECT value FROM settings WHERE chatId = ? AND key = ?', chatId, key);
    if (!row) return defaultValue;
    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

export const setSetting = (chatId, key, value) => {
    return db.run('INSERT OR REPLACE INTO settings (chatId, key, value) VALUES (?, ?, ?)', chatId, key, JSON.stringify(value));
};

export const recalculateStrikes = async (chatId, userId) => {
    const strikeExpirationDays = await getSetting(chatId, 'strikeExpirationDays', 30);
    if (strikeExpirationDays > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - strikeExpirationDays);
        await db.run('DELETE FROM strikes WHERE chatId = ? AND userId = ? AND timestamp < ?', chatId, userId, expirationDate.toISOString());
    }
};