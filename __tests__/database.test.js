// __tests__/database.test.js

import { describe, test, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import * as db from '../src/services/database.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let dbConnection;

// Mock data for tests
const CHAT_ID = '-1001';
const USER_ID_1 = '12345';
const USER_ID_2 = '67890';
const MOCK_USER_1 = { id: USER_ID_1, first_name: 'Test', username: 'testuser' };
const MOCK_USER_2 = { id: USER_ID_2, first_name: 'Another', username: 'anotheruser' };
const MOCK_ADMIN = { id: '99999', first_name: 'Admin' };

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
beforeEach(async () => {
    await db.initDb(true); // Pass true to prevent logging during tests
});

// After EACH test, delete all data from the tables.
afterEach(async () => {
  await dbConnection.exec('DELETE FROM settings');
  await dbConnection.exec('DELETE FROM groups');
  await dbConnection.exec('DELETE FROM strikes');
  await dbConnection.exec('DELETE FROM keyword_whitelist');
  await dbConnection.exec('DELETE FROM audit_log');
});


describe('Database Service - Original Tests', () => {
    test('should set and get a setting', async () => {
        await db.setSetting(CHAT_ID, 'spamThreshold', 0.9);
        const threshold = await db.getSetting(CHAT_ID, 'spamThreshold', 0.85);
        expect(threshold).toBe(0.9);
    });

    test('should return default value for a non-existent setting', async () => {
        const threshold = await db.getSetting(CHAT_ID, 'spamThreshold', 0.85);
        expect(threshold).toBe(0.85);
    });

    test('should add and retrieve a group', async () => {
        await db.addGroup(CHAT_ID, 'Test Group');
        const group = await db.getGroup(CHAT_ID);
        expect(group).toEqual({ chatId: CHAT_ID, chatTitle: 'Test Group' });
    });

    test('should record a strike and update the count', async () => {
        const logData = { type: 'AUTO', timestamp: new Date().toISOString(), user: MOCK_USER_1, messageExcerpt: 'spam', classificationScore: 0.9 };
        
        let strikeCount = await db.recordStrike(CHAT_ID, USER_ID_1, logData);
        expect(strikeCount).toBe(1);

        strikeCount = await db.recordStrike(CHAT_ID, USER_ID_1, logData);
        expect(strikeCount).toBe(2);
    });

    test('should reset strikes', async () => {
        const logData = { type: 'AUTO', timestamp: new Date().toISOString(), user: MOCK_USER_1, messageExcerpt: 'spam', classificationScore: 0.9 };
        await db.recordStrike(CHAT_ID, USER_ID_1, logData);
        
        await db.resetStrikes(CHAT_ID, USER_ID_1);
        const strikes = await db.getStrikes(CHAT_ID, USER_ID_1);
        expect(strikes.count).toBe(0);
    });

    test('should manage keyword whitelist', async () => {
        await db.addWhitelistKeyword(CHAT_ID, 'crypto');
        let keywords = await db.getWhitelistKeywords(CHAT_ID);
        expect(keywords).toContain('crypto');

        await db.removeWhitelistKeyword(CHAT_ID, 'crypto');
        keywords = await db.getWhitelistKeywords(CHAT_ID);
        expect(keywords).not.toContain('crypto');
    });
});

describe('Database Service - Manual Strike Management', () => {
    test('addStrikes should add strikes to a user with none', async () => {
        const newCount = await db.addStrikes(CHAT_ID, USER_ID_1, 2);
        expect(newCount).toBe(2);
    });

    test('addStrikes should add strikes to an existing count', async () => {
        await db.addStrikes(CHAT_ID, USER_ID_1, 2);
        const newCount = await db.addStrikes(CHAT_ID, USER_ID_1, 3);
        expect(newCount).toBe(5);
    });

    test('removeStrike should subtract strikes from an existing count', async () => {
        await db.addStrikes(CHAT_ID, USER_ID_1, 5);
        const newCount = await db.removeStrike(CHAT_ID, USER_ID_1, 2);
        expect(newCount).toBe(3);
    });

    test('removeStrike should not go below zero', async () => {
        await db.addStrikes(CHAT_ID, USER_ID_1, 2);
        const newCount = await db.removeStrike(CHAT_ID, USER_ID_1, 5);
        expect(newCount).toBe(0);
    });
    
    test('setStrikes should set the strike count to a specific value', async () => {
        await db.addStrikes(CHAT_ID, USER_ID_1, 5); // Start with 5
        await db.setStrikes(CHAT_ID, USER_ID_1, 0);
        let strikes = await db.getStrikes(CHAT_ID, USER_ID_1);
        expect(strikes.count).toBe(0);

        await db.setStrikes(CHAT_ID, USER_ID_1, 10);
        strikes = await db.getStrikes(CHAT_ID, USER_ID_1);
        expect(strikes.count).toBe(10);
    });

    test('manual strike adjustments should not update the strike timestamp', async () => {
        const initialTimestamp = new Date().toISOString();
        await db.recordStrike(CHAT_ID, USER_ID_1, { type: 'AUTO', timestamp: initialTimestamp, user: MOCK_USER_1, messageExcerpt: 'spam', classificationScore: 0.9 });
        
        await db.addStrikes(CHAT_ID, USER_ID_1, 2);
        await db.removeStrike(CHAT_ID, USER_ID_1, 1);
        
        const finalStrikes = await db.getStrikes(CHAT_ID, USER_ID_1);
        expect(finalStrikes.timestamp).toBe(initialTimestamp);
    });

    test('getStrikeHistory should retrieve only logs for the specified user', async () => {
        await db.recordStrike(CHAT_ID, USER_ID_1, { type: 'AUTO', timestamp: new Date().toISOString(), user: MOCK_USER_1, messageExcerpt: 'user 1 spam', classificationScore: 0.9 });
        await db.logManualAction(CHAT_ID, USER_ID_2, { type: 'MANUAL-STRIKE-ADD', admin: MOCK_ADMIN, targetUser: MOCK_USER_2, amount: 1, reason: 'user 2 manual' });

        const history1 = await db.getStrikeHistory(CHAT_ID, USER_ID_1);
        const history2 = await db.getStrikeHistory(CHAT_ID, USER_ID_2);

        expect(history1).toHaveLength(1);
        expect(JSON.parse(history1[0].logData).messageExcerpt).toBe('user 1 spam');
        
        expect(history2).toHaveLength(1);
        expect(JSON.parse(history2[0].logData).reason).toBe('user 2 manual');
    });
});