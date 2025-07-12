import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../config/index.js';
import logger from './logger.js';

let db;

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
        CREATE TABLE IF NOT EXISTS keyword_whitelist (
            keyword TEXT PRIMARY KEY COLLATE NOCASE
        );
    `);
    logger.info('Database initialized successfully.');
};

// --- Keyword Whitelist Logic ---
export const addWhitelistKeyword = (keyword) => {
    return db.run('INSERT OR IGNORE INTO keyword_whitelist (keyword) VALUES (?)', keyword);
};

export const removeWhitelistKeyword = (keyword) => {
    return db.run('DELETE FROM keyword_whitelist WHERE keyword = ?', keyword);
};

export const getWhitelistKeywords = async () => {
    const rows = await db.all('SELECT keyword FROM keyword_whitelist');
    return rows.map(row => row.keyword);
};

// --- Strike and Audit Logic ---
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

export const getTotalDeletionsToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.get(`SELECT COUNT(*) as count FROM audit_log WHERE date(timestamp) = ?`, today);
    return result?.count || 0;
};

// --- Settings Logic ---
export const getSetting = async (key, defaultValue) => {
    const row = await db.get('SELECT value FROM settings WHERE key = ?', key);
    if (!row) return defaultValue;
    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

export const setSetting = (key, value) => {
    return db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, JSON.stringify(value));
};