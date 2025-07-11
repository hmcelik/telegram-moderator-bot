import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config/index.js';
import logger from './logger.js';

let db;

/**
 * Initializes the database connection and creates tables if they don't exist.
 */
export const initDb = async () => {
    db = await open({
        filename: config.database.path,
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS strikes (
            userId TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            userId TEXT NOT NULL,
            logData TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
    logger.info('Database initialized successfully.');
};

// --- Strike and Audit Logic ---

/**
 * Increments a user's strike count and records the event in the audit log.
 * @param {string} userId - The user's Telegram ID.
 * @param {object} logData - Data about the deleted message.
 * @returns {Promise<number>} The new strike count for the user.
 */
export const recordStrike = async (userId, logData) => {
    await db.run('BEGIN TRANSACTION');
    try {
        await db.run(
            'INSERT INTO strikes (userId, count) VALUES (?, 1) ON CONFLICT(userId) DO UPDATE SET count = count + 1',
            userId
        );
        await db.run(
            'INSERT INTO audit_log (timestamp, userId, logData) VALUES (?, ?, ?)',
            logData.timestamp,
            userId,
            JSON.stringify(logData)
        );
        await db.run('COMMIT');
        
        const { count } = await getStrikes(userId);
        return count;
    } catch (error) {
        await db.run('ROLLBACK');
        logger.error('Failed to record strike in transaction', error);
        throw error;
    }
};

export const getStrikes = async (userId) => {
    return await db.get('SELECT count FROM strikes WHERE userId = ?', userId) || { count: 0 };
};

export const resetStrikes = (userId) => {
    return db.run('UPDATE strikes SET count = 0 WHERE userId = ?', userId);
};

export const getAuditLogs = (limit = 50) => {
    return db.all('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?', limit);
};

export const getTotalDeletionsToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`SELECT COUNT(*) as count FROM audit_log WHERE date(timestamp) = ?`, today);
    return result.count;
};

// --- Settings Logic ---

/**
 * Retrieves a setting from the database.
 * @param {string} key - The setting's key.
 * @param {*} defaultValue - The value to return if the key is not found.
 * @returns {Promise<*>} The stored value or the default value.
 */
export const getSetting = async (key, defaultValue) => {
    const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
    if (!row) return defaultValue;
    try {
        // Settings are stored as JSON strings
        return JSON.parse(row.value);
    } catch {
        return row.value; // Fallback for non-JSON values
    }
};

/**
 * Persists a setting to the database.
 * @param {string} key - The setting's key.
 * @param {*} value - The value to store (will be stringified).
 */
export const setSetting = (key, value) => {
    return db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
};