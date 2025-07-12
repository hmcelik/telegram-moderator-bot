import TelegramBot from 'node-telegram-bot-api';
import config from '../config/index.js';
import logger from './logger.js';

const bot = new TelegramBot(config.telegram.token, { polling: true });

// Helper function for delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const adminCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export const getChatAdmins = async (chatId) => {
    const cachedAdmins = adminCache.get(chatId);
    if (cachedAdmins && cachedAdmins.timestamp > Date.now() - CACHE_TTL_MS) {
        return cachedAdmins.ids;
    }
    try {
        const admins = await bot.getChatAdministrators(chatId);
        const adminIds = admins.map(admin => admin.user.id);
        adminCache.set(chatId, { ids: adminIds, timestamp: Date.now() });
        logger.info(`Refreshed admin cache for chat ${chatId}. Found ${adminIds.length} admins.`);
        return adminIds;
    } catch (error) {
        logger.error(`Failed to get chat admins for ${chatId}:`, error.response?.body || error.message);
        return cachedAdmins ? cachedAdmins.ids : [];
    }
};

export const deleteMessage = async (chatId, messageId) => {
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch(error) {
    logger.error(`Failed to delete message ${messageId} in chat ${chatId}`, error.response?.body || error.message)
  }
};

export const kickUser = async (chatId, userId) => {
  try {
    await bot.banChatMember(chatId, userId);
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