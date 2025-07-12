import { isPromotional } from '../services/nlp.js';
import { recordStrike, resetStrikes } from '../services/database.js';
import { deleteMessage, kickUser, banUser, muteUser, sendMessage, getChatAdmins } from '../services/telegram.js';
import config from '../config/index.js';
import logger from '../services/logger.js';

export const handleMessage = async (msg) => {
    const { chat, from, text, message_id } = msg;

    // --- FIX ---
    // Ignore all messages in private chats. This handler is only for group moderation.
    if (chat.type === 'private') {
        return;
    }

    const adminIds = await getChatAdmins(chat.id);
    const whitelist = [...adminIds.map(id => id.toString()), ...config.moderatorIds];
    
    if (whitelist.includes(from.id.toString()) || !text) {
        return;
    }

    if (config.keywordWhitelistBypass && config.whitelistedKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()))) {
        logger.info(`Ignoring message from ${from.id} due to whitelisted keyword bypass.`);
        return;
    }

    try {
        const classification = await isPromotional(text, config.whitelistedKeywords);
        const finalScore = classification.score;
        logger.info(`Message from ${from.id} in chat ${chat.id} classified with final score: ${finalScore.toFixed(2)}`);

        if (finalScore >= config.spamThreshold) {
            await deleteMessage(chat.id, message_id);
            const newStrikeCount = await recordStrike(from.id.toString(), {
                timestamp: new Date().toISOString(),
                user: from,
                messageExcerpt: text.substring(0, 100),
                classificationScore: finalScore,
            });

            logger.info(`User ${from.id} committed strike #${newStrikeCount}.`);

            await applyPenalty(chat.id, from, newStrikeCount);
        }
    } catch (error) {
        logger.error(`Error processing message from ${from.id}: ${error.message}`, { stack: error.stack });
    }
};

/**
 * Determines and applies the most severe, applicable penalty for a given strike count.
 */
async function applyPenalty(chatId, user, strikeCount) {
    const actions = [
        { level: config.banLevel, name: 'BAN', execute: () => banUser(chatId, user.id) },
        { level: config.kickLevel, name: 'KICK', execute: () => kickUser(chatId, user.id) },
        { level: config.muteLevel, name: 'MUTE', execute: () => muteUser(chatId, user.id, config.muteDurationMinutes) },
        { level: config.alertLevel, name: 'ALERT', execute: async () => {
            const warningText = config.warningMessage.replace('{user}', `@${user.username || user.first_name}`);
            const sentMsg = await sendMessage(chatId, `⚠️ ${warningText} (Strike ${strikeCount})`);
            setTimeout(() => deleteMessage(chatId, sentMsg.message_id), 15000);
        }},
    ];

    const triggeredActions = actions.filter(action => action.level > 0 && strikeCount >= action.level);

    if (triggeredActions.length === 0) {
        logger.info(`No action configured for strike #${strikeCount}.`);
        return;
    }

    const actionToExecute = triggeredActions.reduce((prev, current) => (prev.level > current.level) ? prev : current);

    logger.warn(`Executing penalty: ${actionToExecute.name} for user ${user.id} at strike #${strikeCount}.`);
    await actionToExecute.execute();

    if (actionToExecute.name === 'KICK' || actionToExecute.name === 'BAN') {
        await resetStrikes(user.id.toString());
        logger.info(`Strikes reset for user ${user.id}.`);
    }
}