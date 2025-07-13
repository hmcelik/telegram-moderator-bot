/**
 * @fileoverview This is the core message processor for the moderation bot.
 * It handles all non-command messages in groups, analyzes them for spam,
 * and applies penalties based on the configured rules for each specific group.
 */

import { isPromotional } from '../services/nlp.js';
import * as db from '../services/database.js';
import { deleteMessage, kickUser, banUser, muteUser, sendMessage, getChatAdmins } from '../services/telegram.js';
import { getGroupSettings } from '../config/index.js';
import logger from '../services/logger.js';

/**
 * Escapes characters that are special in Telegram's MarkdownV2 format.
 * This version uses a single regex for efficiency.
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
const escapeMarkdownV2 = (text) => {
    // The '$&' in the replacement string inserts the matched character.
    // So, '.' becomes '\.', '*' becomes '\*', etc.
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};


/**
 * Main handler for incoming messages.
 *
 * @param {object} msg - The Telegram message object.
 */
export const handleMessage = async (msg) => {
    const { chat, from, text, message_id } = msg;

    // IMPORTANT: Ignore all messages in private chats and non-text messages. This bot is for group moderation only.
    if (chat.type === 'private' || !text) {
        return;
    }

    // Load the specific configuration for this group using its string ID.
    const groupSettings = await getGroupSettings(chat.id.toString());

    // Fetch the list of chat administrators.
    const adminIds = await getChatAdmins(chat.id);

    // Combine chat admins with manually whitelisted moderators into a single whitelist.
    const whitelist = [...adminIds.map(id => id.toString()), ...groupSettings.moderatorIds];

    // Ignore messages from whitelisted users.
    if (whitelist.includes(from.id.toString())) {
        return;
    }

    // If keyword bypass is enabled, check if the message contains any whitelisted keywords.
    if (groupSettings.keywordWhitelistBypass && groupSettings.whitelistedKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
        logger.info(`Ignoring message from ${from.id} in chat ${chat.id} due to whitelisted keyword bypass.`);
        return;
    }

    try {
        // Send the message text to the NLP service for classification.
        const classification = await isPromotional(text, groupSettings.whitelistedKeywords);
        const finalScore = classification.score;
        logger.info(`Message from ${from.id} in chat ${chat.id} classified with final score: ${finalScore.toFixed(2)}`);

        // If the spam score meets or exceeds the configured threshold, take action.
        if (finalScore >= groupSettings.spamThreshold) {
            // 1. Delete the offending message.
            await deleteMessage(chat.id, message_id);

            // 2. Record a strike against the user for this specific chat.
            const newStrikeCount = await db.recordStrike(chat.id.toString(), from.id.toString(), {
                timestamp: new Date().toISOString(),
                user: from,
                messageExcerpt: text.substring(0, 100),
                classificationScore: finalScore,
            });

            logger.info(`User ${from.id} in chat ${chat.id} committed strike #${newStrikeCount}.`);

            // 3. Apply the appropriate penalty based on the new strike count and group-specific settings.
            await applyPenalty(chat.id, from, newStrikeCount, groupSettings);
        }
    } catch (error) {
        logger.error(`Error processing message from ${from.id} in chat ${chat.id}: ${error.message}`, { stack: error.stack });
    }
};

/**
 * Determines and applies the most severe, applicable penalty for a given strike count.
 *
 * @param {string|number} chatId - The ID of the chat where the offense occurred.
 * @param {object} user - The Telegram user object for the offender.
 * @param {number} strikeCount - The user's new total number of strikes in this chat.
 * @param {object} settings - The settings object for the specific group.
 */
async function applyPenalty(chatId, user, strikeCount, settings) {
    const actions = [
        { level: settings.banLevel, name: 'BAN', execute: () => banUser(chatId, user.id) },
        { level: settings.kickLevel, name: 'KICK', execute: () => kickUser(chatId, user.id) },
        { level: settings.muteLevel, name: 'MUTE', execute: () => muteUser(chatId, user.id, settings.muteDurationMinutes) },
        { level: settings.alertLevel, name: 'ALERT', execute: async () => {
            // 1. Create the user tag, which is already valid MarkdownV2.
            const escapedName = escapeMarkdownV2(user.first_name);
            const userTag = `[${escapedName}](tg://user?id=${user.id})`;

            // 2. Split the custom warning message by the {user} placeholder.
            const messageParts = settings.warningMessage.split('{user}');
            const strikePart = ` (Strike ${strikeCount})`;
            
            // 3. Rebuild the message, escaping the text parts while keeping the user tag unescaped.
            let finalMessage = escapeMarkdownV2(messageParts[0]); // Escape the first part.
            if (messageParts.length > 1) {
                finalMessage += userTag; // Add the unescaped user tag.
                // Join the rest of the message parts and escape them.
                finalMessage += escapeMarkdownV2(messageParts.slice(1).join('{user}'));
            }
            finalMessage += escapeMarkdownV2(strikePart); // Escape the final part.

            // 4. Send the fully escaped message.
            const sentMsg = await sendMessage(chatId, finalMessage, { parse_mode: 'MarkdownV2' });

            if (settings.warningMessageDeleteSeconds > 0) {
                setTimeout(() => deleteMessage(chatId, sentMsg.message_id), settings.warningMessageDeleteSeconds * 1000);
            }
        }},
    ];

    const triggeredActions = actions.filter(action => action.level > 0 && strikeCount >= action.level);

    if (triggeredActions.length === 0) {
        logger.info(`No action configured for strike #${strikeCount} in chat ${chatId}.`);
        return;
    }

    const actionToExecute = triggeredActions.reduce((prev, current) => (prev.level > current.level) ? prev : current);

    logger.warn(`Executing penalty: ${actionToExecute.name} for user ${user.id} in chat ${chatId} at strike #${strikeCount}.`);
    await actionToExecute.execute();

    if (actionToExecute.name === 'KICK' || actionToExecute.name === 'BAN') {
        await db.resetStrikes(chatId.toString(), user.id.toString());
        logger.info(`Strikes reset for user ${user.id} in chat ${chatId}.`);
    }
}