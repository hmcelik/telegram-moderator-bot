import { PenaltyMode } from '../utils/enums.js';
import { isPromotional } from '../services/nlp.js';
import { recordStrike, resetStrikes } from '../services/database.js';
import { deleteMessage, kickUser, banUser, muteUser, sendMessage, getChatAdmins } from '../services/telegram.js';
import config from '../config/index.js';
import logger from '../services/logger.js';

export const handleMessage = async (msg) => {
    const { chat, from, text, message_id } = msg;

    const adminIds = await getChatAdmins(chat.id);
    const whitelist = [...adminIds.map(id => id.toString()), ...config.moderatorIds];
    
    if (whitelist.includes(from.id.toString()) || !text) {
        return;
    }

    // Keyword Whitelist Check
    const lowerCaseText = text.toLowerCase();
    for (const keyword of config.whitelistedKeywords) {
        if (lowerCaseText.includes(keyword.toLowerCase())) {
            logger.info(`Ignoring message from ${from.id} due to whitelisted keyword: "${keyword}"`);
            return;
        }
    }

    try {
        const classification = await isPromotional(text);
        logger.info(`Message from ${from.id} in chat ${chat.id} classified with score: ${classification.score}`);

        if (classification.score >= config.spamThreshold) {
            await deleteMessage(chat.id, message_id);
            const newStrikeCount = await recordStrike(from.id.toString(), {
                timestamp: new Date().toISOString(),
                user: from,
                messageExcerpt: text.substring(0, 100),
                classificationScore: classification.score,
            });

            logger.info(`User ${from.id} committed strike #${newStrikeCount}.`);

            switch (newStrikeCount) {
                case 1:
                    const warningText = config.warningMessage.replace('{user}', `@${from.username || from.first_name}`);
                    const sentMsg = await sendMessage(chat.id, `⚠️ ${warningText}`);
                    logger.info(`Sent temporary warning to user ${from.id}.`);
                    setTimeout(() => {
                        deleteMessage(chat.id, sentMsg.message_id);
                    }, 15000);
                    break;
                case 2:
                    await muteUser(chat.id, from.id, config.muteDurationMinutes);
                    sendMessage(chat.id, `🔇 @${from.username || from.first_name} has been muted for ${config.muteDurationMinutes} minutes.`);
                    logger.warn(`MUTED user ${from.id}`);
                    break;
                default:
                    if (newStrikeCount >= config.penaltyLevel) {
                        if (config.penaltyMode === PenaltyMode.BAN) {
                            await banUser(chat.id, from.id);
                            logger.warn(`BANNED user ${from.id}.`);
                        } else {
                            await kickUser(chat.id, from.id);
                            logger.warn(`KICKED user ${from.id}.`);
                        }
                        await resetStrikes(from.id.toString());
                        logger.info(`Strikes reset for user ${from.id}.`);
                    }
                    break;
            }
        }
    } catch (error) {
        logger.error(`Error processing message from ${from.id}: ${error.message}`, { stack: error.stack });
    }
};