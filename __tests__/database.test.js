// __tests__/database.test.js

import { describe, test, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import * as db from '../src/services/database.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbConnection;

// Set up the in-memory database connection ONCE for all tests.
beforeAll(async () => {
  dbConnection = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });
  // Inject the single, persistent connection into the database module.
  db.setDb(dbConnection); 
});

// Before EACH test, initialize the schema.
// This ensures the tables are present for every test.
beforeEach(async () => {
    await db.initDb();
});

// After EACH test, delete all data from the tables.
// This ensures that tests do not interfere with each other.
afterEach(async () => {
  await dbConnection.exec('DELETE FROM settings');
  await dbConnection.exec('DELETE FROM groups');
  await dbConnection.exec('DELETE FROM strikes');
  await dbConnection.exec('DELETE FROM keyword_whitelist');
  await dbConnection.exec('DELETE FROM audit_log');
});


describe('Database Service', () => {
    const chatId = '-1001';
    const userId = '12345';

    test('should set and get a setting', async () => {
        await db.setSetting(chatId, 'spamThreshold', 0.9);
        const threshold = await db.getSetting(chatId, 'spamThreshold', 0.85);
        expect(threshold).toBe(0.9);
    });

    test('should return default value for a non-existent setting', async () => {
        // Since afterEach cleans the DB, this will always be a fresh read.
        const threshold = await db.getSetting(chatId, 'spamThreshold', 0.85);
        expect(threshold).toBe(0.85);
    });

    test('should add and retrieve a group', async () => {
        await db.addGroup(chatId, 'Test Group');
        const group = await db.getGroup(chatId);
        expect(group).toEqual({ chatId, chatTitle: 'Test Group' });
    });

    test('should record a strike and update the count', async () => {
        const logData = { timestamp: new Date().toISOString() };
        
        let strikeCount = await db.recordStrike(chatId, userId, logData);
        expect(strikeCount).toBe(1);

        strikeCount = await db.recordStrike(chatId, userId, logData);
        expect(strikeCount).toBe(2);
    });

    test('should reset strikes', async () => {
        const logData = { timestamp: new Date().toISOString() };
        await db.recordStrike(chatId, userId, logData);
        
        await db.resetStrikes(chatId, userId);
        const strikes = await db.getStrikes(chatId, userId);
        expect(strikes.count).toBe(0);
    });

    test('should manage keyword whitelist', async () => {
        await db.addWhitelistKeyword(chatId, 'crypto');
        let keywords = await db.getWhitelistKeywords(chatId);
        expect(keywords).toContain('crypto');

        await db.removeWhitelistKeyword(chatId, 'crypto');
        keywords = await db.getWhitelistKeywords(chatId);
        expect(keywords).not.toContain('crypto');
    });
});