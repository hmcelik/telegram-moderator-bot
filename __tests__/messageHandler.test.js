// __tests__/messageHandler.test.js

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { handleMessage } from '../src/handlers/messageHandler.js';
import * as nlp from '../src/services/nlp.js';
import * as db from '../src/services/database.js';
import * as telegram from '../src/services/telegram.js';
import { getGroupSettings } from '../src/config/index.js';

// Mock the modules using Vitest's API
vi.mock('../src/services/nlp.js', () => ({
  isPromotional: vi.fn().mockResolvedValue({ score: 0.1 }),
}));

vi.mock('../src/services/database.js', () => ({
  recordStrike: vi.fn().mockResolvedValue(1),
  getSetting: vi.fn(),
  getWhitelistKeywords: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/services/telegram.js', () => ({
  deleteMessage: vi.fn().mockResolvedValue(true),
  sendMessage: vi.fn().mockResolvedValue({ message_id: 'mock_message_id' }),
  getChatAdmins: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/config/index.js', () => ({
    getGroupSettings: vi.fn().mockResolvedValue({
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
    })
}));


describe('Message Handler', () => {
    const mockMsg = {
        message_id: 1,
        chat: { id: -1001, type: 'group', title: 'Test Group' },
        from: { id: 12345, first_name: 'Test', is_bot: false },
        text: 'Hello world',
    };

    test('should ignore non-spam messages', async () => {
        await handleMessage(mockMsg);
        expect(getGroupSettings).toHaveBeenCalledWith(mockMsg.chat.id.toString());
        expect(nlp.isPromotional).toHaveBeenCalled();
        expect(telegram.deleteMessage).not.toHaveBeenCalled();
        expect(db.recordStrike).not.toHaveBeenCalled();
    });

    test('should take action on promotional messages', async () => {
        nlp.isPromotional.mockResolvedValue({ score: 0.9 });

        await handleMessage(mockMsg);

        expect(telegram.deleteMessage).toHaveBeenCalledWith(mockMsg.chat.id, mockMsg.message_id);
        expect(db.recordStrike).toHaveBeenCalledWith(mockMsg.chat.id.toString(), mockMsg.from.id.toString(), expect.any(Object));
        expect(telegram.sendMessage).toHaveBeenCalled();
    });

    test('should ignore messages from chat administrators', async () => {
        telegram.getChatAdmins.mockResolvedValue([mockMsg.from.id]); // User is an admin
        await handleMessage(mockMsg);
        expect(nlp.isPromotional).not.toHaveBeenCalled();
    });
    
    test('should ignore messages from whitelisted moderators', async () => {
        getGroupSettings.mockResolvedValue({ // Mock settings to include the user as a moderator
             moderatorIds: [mockMsg.from.id.toString()],
             whitelistedKeywords: [],
        });
        await handleMessage(mockMsg);
        expect(nlp.isPromotional).not.toHaveBeenCalled();
    });
    
    test('should ignore messages containing a whitelisted keyword', async () => {
         getGroupSettings.mockResolvedValue({
             keywordWhitelistBypass: true,
             whitelistedKeywords: ['hello'], // The message text contains "hello"
             moderatorIds: [],
         });
         
         await handleMessage(mockMsg);
         expect(nlp.isPromotional).not.toHaveBeenCalled();
    });
});