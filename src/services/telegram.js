import TelegramBot from 'node-telegram-bot-api';
import config from '../config/index.js';
import logger from './logger.js';

const bot = new TelegramBot(config.telegram.token, { polling: true });

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const deleteMessage = (chatId, messageId) => {
  return bot.deleteMessage(chatId, messageId);
};

export const kickUser = async (chatId, userId) => {
  try {
    await bot.banChatMember(chatId, userId);
    // ✅ FIXED: Wait for 1 second to ensure the ban is processed before unbanning.
    await delay(1000); 
    await bot.unbanChatMember(chatId, userId, { only_if_banned: true });
    return true;
  } catch (error) {
    logger.error(`Failed to kick user ${userId} from chat ${chatId}:`, error.response?.body || error.message);
    return false;
  }
};

export const banUser = (chatId, userId) => {
  return bot.banChatMember(chatId, userId);
};

/**
 * Mutes a user in the chat for a specified duration.
 * @param {string | number} chatId
 * @param {number} userId
 * @param {number} durationMinutes - The mute duration in minutes.
 */
export const muteUser = (chatId, userId, durationMinutes) => {
  const until_date = Math.floor(Date.now() / 1000) + durationMinutes * 60;
  return bot.restrictChatMember(chatId, userId, {
    can_send_messages: false,
    until_date: until_date
  });
};

export const sendMessage = (chatId, text, options) => {
    return bot.sendMessage(chatId, text, options);
};

export default bot;