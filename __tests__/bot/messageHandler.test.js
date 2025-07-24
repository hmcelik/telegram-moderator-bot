// __tests__/messageHandler.test.js

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { handleMessage } from '../../src/bot/handlers/messageHandler.js';
import * as nlp from '../../src/common/services/nlp.js';
import * as db from '../../src/common/services/database.js';
import * as telegram from '../../src/common/services/telegram.js';
import { getGroupSettings } from '../../src/common/config/index.js';

// Mock the modules using Vitest's API
vi.mock('../../src/common/services/nlp.js');
vi.mock('../../src/common/services/database.js');
vi.mock('../../src/common/services/telegram.js');
vi.mock('../../src/common/config/index.js');

describe('Message Handler', () => {
    const mockMsg = {
        message_id: 1,
        chat: { id: -1001, type: 'group', title: 'Test Group' },
        from: { id: 12345, first_name: 'Test', is_bot: false },
        text: 'Hello world',
    };

    // Define a complete, default settings object
    const fullMockSettings = {
        spamThreshold: 0.85,
        alertLevel: 1,
        kickLevel: 0,
        banLevel: 0,
        muteLevel: 0,
        moderatorIds: [],
        whitelistedKeywords: [],
        keywordWhitelistBypass: true,
        warningMessage: 'Spam detected {user}',
        warningMessageDeleteSeconds: 0,
        goodBehaviorDays: 0,
        muteDurationMinutes: 60,
    };

    // Before each test, clear mock history and set default mock implementations
    beforeEach(() => {
        vi.clearAllMocks();

        nlp.isPromotional.mockResolvedValue({ score: 0.1 });
        db.recordStrike.mockResolvedValue(1);
        db.getStrikes.mockResolvedValue({ count: 0, timestamp: null });
        db.upsertUser.mockResolvedValue(true);
        db.removeStrike.mockResolvedValue(0);
        telegram.getChatAdmins.mockResolvedValue([]);
        telegram.deleteMessage.mockResolvedValue(true);
        telegram.sendMessage.mockResolvedValue({ message_id: 'mock_message_id' });
        telegram.muteUser.mockResolvedValue(true);
        telegram.kickUser.mockResolvedValue(true);
        telegram.banUser.mockResolvedValue(true);
        
        // Use the full default settings object for the mock
        getGroupSettings.mockResolvedValue(fullMockSettings);
    });

    test('should take action on promotional messages', async () => {
        nlp.isPromotional.mockResolvedValue({ score: 0.9 });
        await handleMessage(mockMsg);
        expect(db.upsertUser).toHaveBeenCalledWith(mockMsg.from);
        expect(telegram.deleteMessage).toHaveBeenCalledWith(mockMsg.chat.id, mockMsg.message_id);
        expect(db.recordStrike).toHaveBeenCalledWith(mockMsg.chat.id.toString(), mockMsg.from.id.toString(), expect.any(Object));
        expect(telegram.sendMessage).toHaveBeenCalled();
    });

    describe('Penalties', () => {
        test('should mute user when muteLevel is reached', async () => {
            nlp.isPromotional.mockResolvedValue({ score: 0.9 });
            // **FIX**: Set alertLevel to 0 to ensure mute is the primary action
            getGroupSettings.mockResolvedValue({ ...fullMockSettings, alertLevel: 0, muteLevel: 1 });
            db.recordStrike.mockResolvedValue(1); // Simulate reaching strike 1
            
            await handleMessage(mockMsg);
            expect(telegram.muteUser).toHaveBeenCalled();
        });

        test('should kick user when kickLevel is reached', async () => {
            nlp.isPromotional.mockResolvedValue({ score: 0.9 });
            getGroupSettings.mockResolvedValue({ ...fullMockSettings, kickLevel: 2 });
            db.recordStrike.mockResolvedValue(2); // Simulate reaching strike 2
            
            await handleMessage(mockMsg);
            expect(telegram.kickUser).toHaveBeenCalled();
            expect(db.resetStrikes).toHaveBeenCalled();
        });
    });

    describe('Good Behavior Forgiveness', () => {
        test('should remove one strike for good behavior', async () => {
            const tenDaysAgo = new Date();
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
            
            getGroupSettings.mockResolvedValue({ ...fullMockSettings, goodBehaviorDays: 7 });
            db.getStrikes.mockResolvedValue({ count: 2, timestamp: tenDaysAgo.toISOString() });

            await handleMessage(mockMsg);

            expect(db.removeStrike).toHaveBeenCalledWith(mockMsg.chat.id.toString(), mockMsg.from.id.toString(), 1);
            expect(telegram.sendMessage).toHaveBeenCalledWith(mockMsg.from.id, expect.stringContaining("Your good behavior has been noticed"));
        });

        test('should not remove a strike if behavior period is not met', async () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            getGroupSettings.mockResolvedValue({ ...fullMockSettings, goodBehaviorDays: 7 });
            db.getStrikes.mockResolvedValue({ count: 2, timestamp: twoDaysAgo.toISOString() });

            await handleMessage(mockMsg);
            expect(db.removeStrike).not.toHaveBeenCalled();
        });
    });
});