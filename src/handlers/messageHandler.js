/**
 * @fileoverview This is the core message processor for the moderation bot.
 * It handles all non-command messages in groups, analyzes them for spam,
 * and applies penalties based on the configured rules.
 */

import { isPromotional } from '../services/nlp.js';
import { recordStrike, resetStrikes } from '../services/database.js';
import { deleteMessage, kickUser, banUser, muteUser, sendMessage, getChatAdmins } from '../services/telegram.js';
import config from '../config/index.js';
import logger from '../services/logger.js';

/**
 * Main handler for incoming messages.
 *
 * @param {object} msg - The Telegram message object.
 */
export const handleMessage = async (msg) => {
    const { chat, from, text, message_id } = msg;

    // IMPORTANT: Ignore all messages in private chats. This bot is for group moderation only.
    if (chat.type === 'private') {
        return;
    }

    // Fetch the list of chat administrators.
    const adminIds = await getChatAdmins(chat.id);
    
    // Combine chat admins with manually whitelisted moderators into a single whitelist.
    const whitelist = [...adminIds.map(id => id.toString()), ...config.moderatorIds];
    
    // Ignore messages from whitelisted users or messages without text content.
    if (whitelist.includes(from.id.toString()) || !text) {
        return;
    }

    // If keyword bypass is enabled, check if the message contains any whitelisted keywords.
    if (config.keywordWhitelistBypass && config.whitelistedKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
        logger.info(`Ignoring message from ${from.id} due to whitelisted keyword bypass.`);
        return;
    }

    try {
        // Send the message text to the NLP service for classification.
        const classification = await isPromotional(text, config.whitelistedKeywords);
        const finalScore = classification.score;
        logger.info(`Message from ${from.id} in chat ${chat.id} classified with final score: ${finalScore.toFixed(2)}`);

        // If the spam score meets or exceeds the configured threshold, take action.
        if (finalScore >= config.spamThreshold) {
            // 1. Delete the offending message.
            await deleteMessage(chat.id, message_id);
            
            // 2. Record a strike against the user.
            const newStrikeCount = await recordStrike(from.id.toString(), {
                timestamp: new Date().toISOString(),
                user: from,
                messageExcerpt: text.substring(0, 100),
                classificationScore: finalScore,
            });

            logger.info(`User ${from.id} committed strike #${newStrikeCount}.`);

            // 3. Apply the appropriate penalty based on the new strike count.
            await applyPenalty(chat.id, from, newStrikeCount);
        }
    } catch (error) {
        logger.error(`Error processing message from ${from.id}: ${error.message}`, { stack: error.stack });
    }
};

/**
 * Determines and applies the most severe, applicable penalty for a given strike count.
 * This function ensures that if a user qualifies for multiple penalties, only the
 * highest-level one is executed (e.g., a ban instead of a kick).
 *
 * @param {string} chatId - The ID of the chat where the offense occurred.
 * @param {object} user - The Telegram user object for the offender.
 * @param {number} strikeCount - The user's new total number of strikes.
 */
async function applyPenalty(chatId, user, strikeCount) {
    // Define all possible actions in descending order of severity.
    const actions = [
        { level: config.banLevel, name: 'BAN', execute: () => banUser(chatId, user.id) },
        { level: config.kickLevel, name: 'KICK', execute: () => kickUser(chatId, user.id) },
        { level: config.muteLevel, name: 'MUTE', execute: () => muteUser(chatId, user.id, config.muteDurationMinutes) },
        { level: config.alertLevel, name: 'ALERT', execute: async () => {
            const warningText = config.warningMessage.replace('{user}', `@${user.username || user.first_name}`);
            const sentMsg = await sendMessage(chatId, `⚠️ ${warningText} (Strike ${strikeCount})`);
            // Delete the warning message after a short delay to keep the chat clean.
            setTimeout(() => deleteMessage(chatId, sentMsg.message_id), 15000);
        }},
    ];

    // Filter for actions that are enabled (level > 0) and for which the user's strike count qualifies.
    const triggeredActions = actions.filter(action => action.level > 0 && strikeCount >= action.level);

    // If no actions are triggered, do nothing.
    if (triggeredActions.length === 0) {
        logger.info(`No action configured for strike #${strikeCount}.`);
        return;
    }

    // From the triggered actions, select the one with the highest penalty level.
    const actionToExecute = triggeredActions.reduce((prev, current) => (prev.level > current.level) ? prev : current);

    logger.warn(`Executing penalty: ${actionToExecute.name} for user ${user.id} at strike #${strikeCount}.`);
    await actionToExecute.execute();

    // Reset the user's strikes after a kick or ban.
    if (actionToExecute.name === 'KICK' || actionToExecute.name === 'BAN') {
        await resetStrikes(user.id.toString());
        logger.info(`Strikes reset for user ${user.id}.`);
    }
}