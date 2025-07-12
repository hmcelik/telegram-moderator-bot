/**
 * @fileoverview Manages all interactions with the SQLite database.
 * This includes initializing the database, managing tables for settings,
 * user strikes, audit logs, and whitelisted keywords.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config/index.js';
import logger from './logger.js';

// The database connection object.
let db;

/**
 * Initializes the database connection and creates tables if they do not exist.
 * This function must be called at application startup.
 */
export const initDb = async () => {
    // Open a connection to the SQLite database file.
    db = await open({
        filename: config.database.path,
        driver: sqlite3.Database,
    });

    // Execute CREATE TABLE statements to ensure the required schema exists.
    // 'IF NOT EXISTS' prevents errors on subsequent runs.
    await db.exec(`
        -- Stores the number of strikes for each user.
        CREATE TABLE IF NOT EXISTS strikes (
            userId TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0
        );
        -- Logs every moderation action (deletion, penalty).
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            userId TEXT NOT NULL,
            logData TEXT NOT NULL
        );
        -- Stores all dynamic configuration settings for the bot.
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        -- Stores whitelisted keywords that bypass AI spam checks.
        CREATE TABLE IF NOT EXISTS keyword_whitelist (
            keyword TEXT PRIMARY KEY COLLATE NOCASE -- Case-insensitive matching
        );
    `);
    logger.info('Database initialized successfully.');
};

// --- Keyword Whitelist Logic ---

/**
 * Adds a keyword to the whitelist.
 * 'INSERT OR IGNORE' prevents duplicates.
 * @param {string} keyword - The keyword to add.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const addWhitelistKeyword = (keyword) => {
    return db.run('INSERT OR IGNORE INTO keyword_whitelist (keyword) VALUES (?)', keyword);
};

/**
 * Removes a keyword from the whitelist.
 * @param {string} keyword - The keyword to remove.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const removeWhitelistKeyword = (keyword) => {
    return db.run('DELETE FROM keyword_whitelist WHERE keyword = ?', keyword);
};

/**
 * Retrieves all keywords from the whitelist.
 * @returns {Promise<string[]>} A promise that resolves to an array of keywords.
 */
export const getWhitelistKeywords = async () => {
    const rows = await db.all('SELECT keyword FROM keyword_whitelist');
    return rows.map(row => row.keyword);
};


// --- Strike and Audit Logic ---

/**
 * Records a new strike for a user and logs the event in a single transaction.
 * A transaction ensures that both operations succeed or neither do.
 * @param {string} userId - The ID of the user receiving the strike.
 * @param {object} logData - Data related to the offense for auditing purposes.
 * @returns {Promise<number>} A promise that resolves to the user's new strike count.
 */
export const recordStrike = async (userId, logData) => {
    await db.run('BEGIN TRANSACTION');
    try {
        // Increment the user's strike count, or insert a new record if it's their first strike.
        await db.run(
            'INSERT INTO strikes (userId, count) VALUES (?, 1) ON CONFLICT(userId) DO UPDATE SET count = count + 1',
            userId
        );
        // Add a detailed entry to the audit log.
        await db.run(
            'INSERT INTO audit_log (timestamp, userId, logData) VALUES (?, ?, ?)',
            logData.timestamp,
            userId,
            JSON.stringify(logData)
        );
        await db.run('COMMIT');
        
        // Return the updated strike count.
        const { count } = await getStrikes(userId);
        return count;
    } catch (error) {
        // If any part of the transaction fails, roll back all changes.
        await db.run('ROLLBACK');
        logger.error('Failed to record strike in transaction', error);
        throw error;
    }
};

/**
 * Retrieves the current strike count for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{count: number}>} A promise resolving to an object with the user's strike count.
 */
export const getStrikes = async (userId) => {
    return await db.get('SELECT count FROM strikes WHERE userId = ?', userId) || { count: 0 };
};

/**
 * Resets a user's strike count to zero.
 * @param {string} userId - The ID of the user.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const resetStrikes = (userId) => {
    return db.run('UPDATE strikes SET count = 0 WHERE userId = ?', userId);
};

/**
 * Gets the total number of message deletions recorded today.
 * @returns {Promise<number>} A promise that resolves to the count of deletions.
 */
export const getTotalDeletionsToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`SELECT COUNT(*) as count FROM audit_log WHERE date(timestamp) = ?`, today);
    return result?.count || 0;
};


// --- Settings Logic ---

/**
 * Retrieves a setting's value from the database.
 * If the value is a JSON string, it is parsed automatically.
 * @param {string} key - The key of the setting to retrieve.
 * @param {*} defaultValue - The value to return if the key is not found.
 * @returns {Promise<*>} A promise that resolves to the setting's value.
 */
export const getSetting = async (key, defaultValue) => {
    const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
    if (!row) return defaultValue;
    try {
        // Attempt to parse the value as JSON, falling back to the raw value if it fails.
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

/**
 * Saves or updates a setting in the database.
 * The value is JSON stringified before being stored.
 * @param {string} key - The key of the setting to save.
 * @param {*} value - The value of the setting.
 * @returns {Promise} A promise that resolves when the operation is complete.
 */
export const setSetting = (key, value) => {
    return db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
};