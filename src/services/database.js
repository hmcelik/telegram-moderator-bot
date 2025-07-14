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
export const initDb = async () => {
    // If the database connection is already open, simply ensure the tables exist.
    if (!db) {
        const dbPath = process.env.DATABASE_PATH || './moderator.db';
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
        -- Stores the number of strikes for each user per group.
        CREATE TABLE IF NOT EXISTS strikes (
            chatId TEXT NOT NULL,
            userId TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
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
    logger.info('Database initialized successfully.');
};

/**
 * Injects a database connection object. Used for testing purposes.
 * @param {object} dbConnection - The database connection object from sqlite.open().
 */
export const setDb = (dbConnection) => {
    db = dbConnection;
};

// --- Group Management ---

/**
 * Adds a group to the database when the bot joins.
 * @param {string} chatId - The ID of the chat.
 * @param {string} chatTitle - The title of the chat.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const addGroup = (chatId, chatTitle) => {
    return db.run('INSERT OR REPLACE INTO groups (chatId, chatTitle) VALUES (?, ?)', chatId, chatTitle);
};

/**
 * Removes a group from the database when the bot leaves or is kicked.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const removeGroup = (chatId) => {
    return db.run('DELETE FROM groups WHERE chatId = ?', chatId);
};

/**
 * Retrieves all groups the bot is a member of.
 * @returns {Promise<Array<{chatId: string, chatTitle: string}>>} A promise that resolves to an array of group objects.
 */
export const getAllGroups = () => {
    return db.all('SELECT * FROM groups');
};

/**
 * Retrieves a single group by its ID.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise<{chatId: string, chatTitle: string}>} A promise that resolves to the group object.
 */
export const getGroup = (chatId) => {
    return db.get('SELECT * FROM groups WHERE chatId = ?', chatId);
};


// --- Keyword Whitelist Logic ---

/**
 * Adds a keyword to the whitelist for a specific chat.
 * 'INSERT OR IGNORE' prevents duplicates.
 * @param {string} chatId - The ID of the chat.
 * @param {string} keyword - The keyword to add.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const addWhitelistKeyword = (chatId, keyword) => {
    return db.run('INSERT OR IGNORE INTO keyword_whitelist (chatId, keyword) VALUES (?, ?)', chatId, keyword);
};

/**
 * Removes a keyword from the whitelist for a specific chat.
 * @param {string} chatId - The ID of the chat.
 * @param {string} keyword - The keyword to remove.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const removeWhitelistKeyword = (chatId, keyword) => {
    return db.run('DELETE FROM keyword_whitelist WHERE chatId = ? AND keyword = ?', chatId, keyword);
};

/**
 * Retrieves all keywords from the whitelist for a specific chat.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise<string[]>} A promise that resolves to an array of keywords.
 */
export const getWhitelistKeywords = async (chatId) => {
    const rows = await db.all('SELECT keyword FROM keyword_whitelist WHERE chatId = ?', chatId);
    return rows.map(row => row.keyword);
};


// --- Strike and Audit Logic ---

/**
 * Records a new strike for a user in a specific chat and logs the event in a single transaction.
 * A transaction ensures that both operations succeed or neither do.
 * @param {string} chatId - The ID of the chat.
 * @param {string} userId - The ID of the user receiving the strike.
 * @param {object} logData - Data related to the offense for auditing purposes.
 * @returns {Promise<number>} A promise that resolves to the user's new strike count in that chat.
 */
export const recordStrike = async (chatId, userId, logData) => {
    await db.run('BEGIN TRANSACTION');
    try {
        // Increment the user's strike count for the specific chat, or insert a new record if it's their first strike.
        await db.run(
            'INSERT INTO strikes (chatId, userId, count) VALUES (?, ?, 1) ON CONFLICT(chatId, userId) DO UPDATE SET count = count + 1',
            chatId,
            userId
        );
        // Add a detailed entry to the audit log.
        await db.run(
            'INSERT INTO audit_log (timestamp, chatId, userId, logData) VALUES (?, ?, ?, ?)',
            logData.timestamp,
            chatId,
            userId,
            JSON.stringify(logData)
        );
        await db.run('COMMIT');
        
        // Return the updated strike count.
        const { count } = await getStrikes(chatId, userId);
        return count;
    } catch (error) {
        // If any part of the transaction fails, roll back all changes.
        await db.run('ROLLBACK');
        logger.error('Failed to record strike in transaction', error);
        throw error;
    }
};

/**
 * Retrieves the current strike count for a specific user in a specific chat.
 * @param {string} chatId - The ID of the chat.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{count: number}>} A promise resolving to an object with the user's strike count.
 */
export const getStrikes = async (chatId, userId) => {
    return await db.get('SELECT count FROM strikes WHERE chatId = ? AND userId = ?', chatId, userId) || { count: 0 };
};

/**
 * Resets a user's strike count to zero in a specific chat.
 * @param {string} chatId - The ID of the chat.
 * @param {string} userId - The ID of the user.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const resetStrikes = (chatId, userId) => {
    return db.run('UPDATE strikes SET count = 0 WHERE chatId = ? AND userId = ?', chatId, userId);
};

/**
 * Gets the total number of message deletions recorded today in a specific chat.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise<number>} A promise that resolves to the count of deletions.
 */
export const getTotalDeletionsToday = async (chatId) => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`SELECT COUNT(*) as count FROM audit_log WHERE chatId = ? AND date(timestamp) = ?`, chatId, today);
    return result?.count || 0;
};


// --- Settings Logic ---

/**
 * Retrieves a setting's value from the database for a specific chat.
 * If the setting is not found for the chat, it returns the provided default value.
 * If the value is a JSON string, it is parsed automatically.
 * @param {string} chatId - The ID of the chat.
 * @param {string} key - The key of the setting to retrieve.
 * @param {*} defaultValue - The value to return if the key is not found.
 * @returns {Promise<*>} A promise that resolves to the setting's value.
 */
export const getSetting = async (chatId, key, defaultValue) => {
    const row = await db.get('SELECT value FROM settings WHERE chatId = ? AND key = ?', chatId, key);
    if (!row) {
        return defaultValue;
    }
    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

/**
 * Saves or updates a setting in the database for a specific chat.
 * The value is JSON stringified before being stored.
 * @param {string} chatId - The ID of the chat.
 * @param {string} key - The key of the setting to save.
 * @param {*} value - The value of the setting.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const setSetting = (chatId, key, value) => {
    return db.run('INSERT OR REPLACE INTO settings (chatId, key, value) VALUES (?, ?, ?)', chatId, key, JSON.stringify(value));
};