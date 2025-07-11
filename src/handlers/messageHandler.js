import { PenaltyMode } from '../utils/enums.js';
import { isPromotional } from '../services/nlp.js';
import { recordStrike, resetStrikes } from '../services/database.js';
import { deleteMessage, kickUser, banUser, muteUser, sendMessage } from '../services/telegram.js';
import config from '../config/index.js';
import logger from '../services/logger.js';

export const handleMessage = async (msg) => {
    const { chat, from, text, message_id } = msg;

    if (config.moderatorIds.includes(from.id.toString()) || !text) {
        return;
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

            // --- New Multi-Stage Penalty Logic ---
            switch (newStrikeCount) {
                case 1:
                    // 1st Offense: Public Warning
                    const warningText = config.warningMessage.replace('{user}', `@${from.username || from.first_name}`);
                    sendMessage(chat.id, `⚠️ ${warningText}`);
                    logger.info(`Sent warning to user ${from.id}.`);
                    break;
                
                case 2:
                    // 2nd Offense: Mute User
                    await muteUser(chat.id, from.id, config.muteDurationMinutes);
                    sendMessage(chat.id, `🔇 @${from.username || from.first_name} has been muted for ${config.muteDurationMinutes} minutes due to repeated violations.`);
                    logger.warn(`MUTED user ${from.id} for ${config.muteDurationMinutes} minutes.`);
                    break;
                
                default:
                    // Final Offense (>= penaltyLevel)
                    if (newStrikeCount >= config.penaltyLevel) {
                        if (config.penaltyMode === PenaltyMode.BAN) {
                            await banUser(chat.id, from.id);
                            logger.warn(`BANNED user ${from.id} after reaching strike limit.`);
                        } else {
                            await kickUser(chat.id, from.id);
                            logger.warn(`KICKED user ${from.id} after reaching strike limit.`);
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