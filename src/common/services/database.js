/**
 * @fileoverview Manages all interactions with the SQLite database.
 * This includes initializing the database, managing tables for settings,
 * user strikes, audit logs, and whitelisted keywords.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from './logger.js';

// The database connection object. It will be initialized once.
let db;

/**
 * Initializes the database connection and creates tables if they do not exist.
 * This function must be called at application startup.
 * Renamed from initDb to initializeDatabase to match what server.js expects.
 */
export const initializeDatabase = async (isTest = false) => {
    if (db) {
        return; // Already initialized
    }

    try {
        const dbPath = isTest ? ':memory:' : (process.env.DATABASE_PATH || './moderator.db');
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        // Use PRAGMA for better performance and concurrency
        await db.exec('PRAGMA journal_mode = WAL;');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS groups (
                chatId TEXT PRIMARY KEY,
                chatTitle TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS users (
                userId TEXT PRIMARY KEY,
                username TEXT,
                firstName TEXT,
                lastName TEXT
            );
            CREATE TABLE IF NOT EXISTS strikes (
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                timestamp TEXT,
                PRIMARY KEY (chatId, userId)
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                chatId TEXT NOT NULL,
                userId TEXT NOT NULL,
                logData TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                chatId TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                PRIMARY KEY (chatId, key)
            );
            CREATE TABLE IF NOT EXISTS keyword_whitelist (
                chatId TEXT NOT NULL,
                keyword TEXT NOT NULL COLLATE NOCASE,
                PRIMARY KEY (chatId, keyword)
            );
        `);

        if (!isTest) {
            logger.info('Database initialized successfully.');
        }
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error; // Rethrow the error to stop the application from starting
    }
};

/**
 * Returns the active database connection instance.
 * Throws an error if the database has not been initialized.
 */
export const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase first.');
    }
    return db;
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
    return getDb().run(
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
    return getDb().get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', username);
};


// --- Group Management ---

export const addGroup = (chatId, chatTitle) => {
    return getDb().run('INSERT OR REPLACE INTO groups (chatId, chatTitle) VALUES (?, ?)', chatId, chatTitle);
};

export const removeGroup = (chatId) => {
    return getDb().run('DELETE FROM groups WHERE chatId = ?', chatId);
};

export const getAllGroups = () => {
    return getDb().all('SELECT * FROM groups');
};

export const getGroup = (chatId) => {
    return getDb().get('SELECT * FROM groups WHERE chatId = ?', chatId);
};


// --- Keyword Whitelist Logic ---

export const addWhitelistKeyword = (chatId, keyword) => {
    return getDb().run('INSERT OR IGNORE INTO keyword_whitelist (chatId, keyword) VALUES (?, ?)', chatId, keyword);
};

export const removeWhitelistKeyword = (chatId, keyword) => {
    return getDb().run('DELETE FROM keyword_whitelist WHERE chatId = ? AND keyword = ?', chatId, keyword);
};

export const getWhitelistKeywords = async (chatId) => {
    const rows = await getDb().all('SELECT keyword FROM keyword_whitelist WHERE chatId = ?', chatId);
    return rows.map(row => row.keyword);
};


// --- Strike and Audit Logic ---

export const recordStrike = async (chatId, userId, logData) => {
    const dbInstance = getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    try {
        await dbInstance.run(
            'INSERT INTO strikes (chatId, userId, count, timestamp) VALUES (?, ?, 1, ?) ON CONFLICT(chatId, userId) DO UPDATE SET count = count + 1, timestamp = ?',
            chatId,
            userId,
            new Date().toISOString(),
            new Date().toISOString()
        );
        await dbInstance.run(
            'INSERT INTO audit_log (timestamp, chatId, userId, logData) VALUES (?, ?, ?, ?)',
            logData.timestamp,
            chatId,
            userId,
            JSON.stringify(logData)
        );
        await dbInstance.run('COMMIT');

        const { count } = await getStrikes(chatId, userId);
        return count;
    } catch (error) {
        await dbInstance.run('ROLLBACK');
        logger.error('Failed to record strike in transaction', error);
        throw error;
    }
};

export const logManualAction = (chatId, userId, logData) => {
    return getDb().run(
        'INSERT INTO audit_log (timestamp, chatId, userId, logData) VALUES (?, ?, ?, ?)',
        new Date().toISOString(),
        chatId,
        userId,
        JSON.stringify(logData)
    );
};

export const getStrikes = async (chatId, userId) => {
    await recalculateStrikes(chatId, userId);
    return await getDb().get('SELECT count, timestamp FROM strikes WHERE chatId = ? AND userId = ?', chatId, userId) || { count: 0, timestamp: null };
};

export const resetStrikes = (chatId, userId) => {
    return getDb().run('UPDATE strikes SET count = 0, timestamp = NULL WHERE chatId = ? AND userId = ?', chatId, userId);
};

export const addStrikes = async (chatId, userId, amount) => {
    await getDb().run(
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
    await getDb().run('UPDATE strikes SET count = ? WHERE chatId = ? AND userId = ?', newCount, chatId, userId);
    return newCount;
};

export const setStrikes = async (chatId, userId, amount) => {
    await getDb().run(
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
    const result = await getDb().get(`SELECT COUNT(*) as count FROM audit_log WHERE chatId = ? AND date(timestamp) = ?`, chatId, today);
    return result?.count || 0;
};

export const getAuditLog = (chatId, limit = 15) => {
    return getDb().all('SELECT * FROM audit_log WHERE chatId = ? ORDER BY timestamp DESC LIMIT ?', chatId, limit);
};

export const getStrikeHistory = (chatId, userId, limit = 10) => {
    return getDb().all('SELECT * FROM audit_log WHERE chatId = ? AND userId = ? ORDER BY timestamp DESC LIMIT ?', chatId, userId, limit);
};

// --- Settings Logic ---

export const getSetting = async (chatId, key, defaultValue) => {
    const row = await getDb().get('SELECT value FROM settings WHERE chatId = ? AND key = ?', chatId, key);
    if (!row) return defaultValue;
    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
};

export const setSetting = (chatId, key, value) => {
    return getDb().run('INSERT OR REPLACE INTO settings (chatId, key, value) VALUES (?, ?, ?)', chatId, key, JSON.stringify(value));
};

export const recalculateStrikes = async (chatId, userId) => {
    const strikeExpirationDays = await getSetting(chatId, 'strikeExpirationDays', 30);
    if (strikeExpirationDays > 0) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - strikeExpirationDays);
        await getDb().run('DELETE FROM strikes WHERE chatId = ? AND userId = ? AND timestamp < ?', chatId, userId, expirationDate.toISOString());
    }
};

// --- WebApp Additional Functions ---

export const getUser = (userId) => {
    return getDb().get('SELECT * FROM users WHERE userId = ?', userId.toString());
};

export const getUserAdminGroups = async (userId) => {
    // This would typically require checking with Telegram API
    // For now, return groups where user has been active as admin
    return getDb().all(`
        SELECT DISTINCT g.* 
        FROM groups g 
        INNER JOIN audit_log a ON g.chatId = a.chatId 
        WHERE a.userId = ? 
        ORDER BY g.chatTitle
    `, userId.toString());
};

export const isUserGroupAdmin = async (userId, groupId) => {
    // Check if user has admin activity in this group
    // In a real implementation, you'd verify with Telegram API
    const activity = await getDb().get(`
        SELECT COUNT(*) as count 
        FROM audit_log 
        WHERE userId = ? AND chatId = ?
    `, userId.toString(), groupId);
    
    return activity && activity.count > 0;
};

export const setWhitelistKeywords = async (chatId, keywords) => {
    const dbInstance = getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    try {
        // Clear existing keywords
        await dbInstance.run('DELETE FROM keyword_whitelist WHERE chatId = ?', chatId);
        
        // Add new keywords
        for (const keyword of keywords) {
            await dbInstance.run('INSERT INTO keyword_whitelist (chatId, keyword) VALUES (?, ?)', chatId, keyword);
        }
        
        await dbInstance.run('COMMIT');
    } catch (error) {
        await dbInstance.run('ROLLBACK');
        logger.error('Failed to set whitelist keywords:', error);
        throw error;
    }
};

export const getGroupStats = async (groupId, startDate, endDate) => {
    const dbInstance = getDb();
    
    try {
        // Get basic statistics
        const totalMessages = await dbInstance.get(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ?
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const flaggedMessages = await dbInstance.get(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.action') IN ('flagged', 'deleted')
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const deletedMessages = await dbInstance.get(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.action') = 'deleted'
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const mutedUsers = await dbInstance.get(`
            SELECT COUNT(DISTINCT userId) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.action') = 'muted'
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const kickedUsers = await dbInstance.get(`
            SELECT COUNT(DISTINCT userId) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.action') = 'kicked'
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const bannedUsers = await dbInstance.get(`
            SELECT COUNT(DISTINCT userId) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.action') = 'banned'
        `, groupId, startDate.toISOString(), endDate.toISOString());

        // Get average spam score
        const spamScores = await dbInstance.all(`
            SELECT JSON_EXTRACT(logData, '$.spamScore') as score 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.spamScore') IS NOT NULL
        `, groupId, startDate.toISOString(), endDate.toISOString());

        const avgSpamScore = spamScores.length > 0 
            ? spamScores.reduce((sum, row) => sum + parseFloat(row.score || 0), 0) / spamScores.length 
            : 0;

        // Get top violation types
        const violationTypes = await dbInstance.all(`
            SELECT JSON_EXTRACT(logData, '$.violationType') as type, COUNT(*) as count 
            FROM audit_log 
            WHERE chatId = ? AND timestamp BETWEEN ? AND ? 
            AND JSON_EXTRACT(logData, '$.violationType') IS NOT NULL 
            GROUP BY JSON_EXTRACT(logData, '$.violationType') 
            ORDER BY count DESC 
            LIMIT 5
        `, groupId, startDate.toISOString(), endDate.toISOString());

        return {
            totalMessages: totalMessages?.count || 0,
            flaggedMessages: flaggedMessages?.count || 0,
            deletedMessages: deletedMessages?.count || 0,
            mutedUsers: mutedUsers?.count || 0,
            kickedUsers: kickedUsers?.count || 0,
            bannedUsers: bannedUsers?.count || 0,
            averageSpamScore: Math.round(avgSpamScore * 100) / 100,
            topViolationTypes: violationTypes.map(row => ({
                type: row.type,
                count: row.count
            }))
        };
    } catch (error) {
        logger.error('Error getting group stats:', error);
        throw error;
    }
};

/**
 * Get total count of unique users across all groups
 */
export const getTotalUsersCount = async () => {
    try {
        const result = await db.get('SELECT COUNT(DISTINCT userId) as count FROM users');
        return result?.count || 0;
    } catch (error) {
        logger.error('Error getting total users count:', error);
        throw error;
    }
};

/**
 * Get total count of active strikes across all groups
 */
export const getTotalStrikesCount = async () => {
    try {
        const result = await db.get('SELECT SUM(count) as total FROM strikes WHERE count > 0');
        return result?.total || 0;
    } catch (error) {
        logger.error('Error getting total strikes count:', error);
        throw error;
    }
};

/**
 * Get total deletions today across all groups (for super admin)
 */
export const getGlobalDeletionsToday = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const result = await db.get(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE timestamp >= ? AND timestamp < ?
            AND logData LIKE '%AUTO%'
        `, today.toISOString(), tomorrow.toISOString());
        
        return result?.count || 0;
    } catch (error) {
        logger.error('Error getting global deletions today:', error);
        throw error;
    }
};

/**
 * Get top groups by deletion count
 */
export const getTopGroupsByDeletions = async (limit = 5) => {
    try {
        const result = await db.all(`
            SELECT 
                g.chatId,
                g.chatTitle,
                COUNT(al.id) as deletions
            FROM groups g
            LEFT JOIN audit_log al ON g.chatId = al.chatId 
                AND al.logData LIKE '%AUTO%'
            GROUP BY g.chatId, g.chatTitle
            ORDER BY deletions DESC
            LIMIT ?
        `, limit);
        
        return result || [];
    } catch (error) {
        logger.error('Error getting top groups by deletions:', error);
        throw error;
    }
};