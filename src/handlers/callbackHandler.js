import logger from '../services/logger.js';
import { editMessageText, answerCallbackQuery, sendMessage } from '../services/telegram.js';
import { mainKeyboard } from '../keyboards/mainMenu.js';
import { aiSensitivityKeyboard } from '../keyboards/aiSensitivityMenu.js';
import { penaltyLevelsKeyboard } from '../keyboards/penaltyLevelsMenu.js';
import { miscKeyboard } from '../keyboards/miscMenu.js';
import { whitelistKeyboard } from '../keyboards/whitelistMenu.js';
import { keywordMenuKeyboard } from '../keyboards/keywordMenu.js';
import { moderatorMenuKeyboard } from '../keyboards/moderatorMenu.js';
import config, { updateSetting, loadSettingsFromDb } from '../config/index.js';
import * as db from '../services/database.js';
import bot from '../services/telegram.js';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// State management
const userState = new Map();
let activeMenu = {
    messageId: null,
    chatId: null,
    text: '',
    keyboard: null, // Stores the entire keyboard object
};

/**
 * Sets or updates the state of the currently active menu message.
 * @param {object} message - The Telegram message object for the menu.
 * @param {string} [text] - Optional new text for the menu.
 * @param {object} [keyboard] - Optional new keyboard object.
 */
export const setActiveMenu = (message, text, keyboard) => {
    if (!message) return;
    activeMenu.messageId = message.message_id;
    activeMenu.chatId = message.chat.id;
    if (text) activeMenu.text = text;
    if (keyboard) activeMenu.keyboard = keyboard;
};

/**
 * Main handler for all incoming callback queries from inline keyboards.
 */
export const handleCallback = async (callbackQuery) => {
    const { from, message, data } = callbackQuery;
    const [action] = data.split(':');

    if (from.id.toString() !== ADMIN_USER_ID) {
        await answerCallbackQuery(callbackQuery.id, { text: 'You are not authorized.' });
        return;
    }

    logger.info(`Admin callback received: ${data}`);

    try {
        let text, keyboard;
        let isMenuNavigation = true;

        switch (action) {
            case 'settings_main':
                text = 'Welcome to the bot settings panel. Please choose a category.';
                keyboard = mainKeyboard;
                break;
            case 'settings_ai_sensitivity':
                text = 'Configure AI sensitivity settings:';
                keyboard = aiSensitivityKeyboard();
                break;
            case 'settings_penalty_levels':
                text = 'Configure penalty level settings:';
                keyboard = penaltyLevelsKeyboard();
                break;
            case 'settings_whitelist':
                text = 'Manage keyword and user whitelists:';
                keyboard = whitelistKeyboard;
                break;
            case 'settings_misc':
                text = 'Configure miscellaneous settings:';
                keyboard = miscKeyboard();
                break;
            case 'whitelist_keywords':
                text = 'Manage whitelisted keywords that bypass AI checks.';
                keyboard = keywordMenuKeyboard;
                break;
            case 'whitelist_mods':
                text = 'Manage whitelisted moderator IDs.';
                keyboard = moderatorMenuKeyboard;
                break;

            case 'list_keywords':
            case 'list_mods':
                isMenuNavigation = false;
                const isKeywords = action === 'list_keywords';
                const items = isKeywords ? await db.getWhitelistKeywords() : config.moderatorIds;
                const title = isKeywords ? '📜 Whitelisted Keywords' : '👥 Whitelisted Moderator IDs';
                const itemList = items.length > 0 ? items.map(item => `- \`${item}\``).join('\n') : `No ${isKeywords ? 'keywords' : 'moderators'} whitelisted.`;
                await sendMessage(message.chat.id, `**${title}**\n${itemList}`, { parse_mode: 'Markdown'});
                break;

            case 'toggle_bypass':
                const newBypassValue = !config.keywordWhitelistBypass;
                await updateSetting('keywordWhitelistBypass', newBypassValue);
                await answerCallbackQuery(callbackQuery.id, { text: `Keyword Bypass is now ${newBypassValue ? 'ON' : 'OFF'}` });
                text = 'Configure AI sensitivity settings:';
                keyboard = aiSensitivityKeyboard();
                break;

            default:
                isMenuNavigation = false;
                userState.set(from.id, { action: data });
                await editMessageText(`Please send the new value for **${action.replace(/_/g, ' ')}**.`, {
                    chat_id: message.chat.id,
                    message_id: message.message_id,
                    reply_markup: { inline_keyboard: [] },
                    parse_mode: 'Markdown'
                });
                break;
        }

        if (isMenuNavigation) {
            await editMessageText(text, {
                chat_id: message.chat.id,
                message_id: message.message_id,
                ...keyboard,
                parse_mode: 'Markdown'
            });
            // Update the active menu state when we navigate
            setActiveMenu(message, text, keyboard);
        }
        await answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        if (error.response && error.response.body?.description.includes('message is not modified')) {
            logger.warn('Ignoring "message is not modified" error.');
        } else {
            logger.error('Error in callback handler:', error);
            await answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
        }
    }
};

/**
 * Handler for text messages, specifically to process pending admin inputs.
 */
bot.on('text', async (msg) => {
    const { from, text, chat } = msg;

    if (from.id.toString() !== ADMIN_USER_ID || !userState.has(from.id)) {
        return;
    }
    
    const { action } = userState.get(from.id);
    userState.delete(from.id);

    try {
        let responseMessage = '✅ Success!';
        if (action.startsWith('set_')) {
            const settingKey = action === 'set_threshold' ? 'spamThreshold' : action === 'set_mute_duration' ? 'muteDurationMinutes' : `${action.split('_')[1]}Level`;
            const value = settingKey === 'spamThreshold' ? parseFloat(text) : parseInt(text, 10);
            if (isNaN(value)) {
                responseMessage = '❌ Invalid number provided.';
            } else {
                await updateSetting(settingKey, value);
                responseMessage = `✅ **${settingKey}** updated to **${value}**.`;
            }
        } else if (action.includes('keyword')) {
            const keyword = text.toLowerCase();
            if (action === 'add_keyword') await db.addWhitelistKeyword(keyword); else await db.removeWhitelistKeyword(keyword);
            responseMessage = `✅ Keyword **"${keyword}"** action completed.`;
        } else if (action.includes('mod')) {
            const modId = text;
            let newMods = [...config.moderatorIds];
            if (action === 'add_mod' && !newMods.includes(modId)) newMods.push(modId); 
            else if (action === 'remove_mod') newMods = newMods.filter(id => id !== modId);
            await updateSetting('moderatorIds', newMods);
            responseMessage = `✅ Moderator ID **${modId}** action completed.`;
        }

        await loadSettingsFromDb();
        await sendMessage(chat.id, responseMessage, { parse_mode: 'Markdown' });

        // --- FIX: Restore the correct menu with fresh data ---
        if (activeMenu.text && activeMenu.keyboard) {
            let menuText = activeMenu.text;
            let keyboard = activeMenu.keyboard;

            // Determine which menu to restore based on the action taken
            if (action.startsWith('set_') && !action.includes('keyword') && !action.includes('mod')) {
                 if (action.includes('threshold')) {
                    menuText = 'Configure AI sensitivity settings:'; keyboard = aiSensitivityKeyboard();
                } else if (action.includes('duration')) {
                    menuText = 'Configure miscellaneous settings:'; keyboard = miscKeyboard();
                } else { // It's a penalty level
                    menuText = 'Configure penalty level settings:'; keyboard = penaltyLevelsKeyboard();
                }
            } else if (action.includes('keyword')) {
                menuText = 'Manage whitelisted keywords that bypass AI checks.'; keyboard = keywordMenuKeyboard;
            } else if (action.includes('mod')) {
                menuText = 'Manage whitelisted moderator IDs.'; keyboard = moderatorMenuKeyboard;
            }

            const newMenuMessage = await sendMessage(chat.id, menuText, keyboard);
            setActiveMenu(newMenuMessage, menuText, keyboard);
        }

    } catch (error) {
        logger.error(`Failed to process text input for action ${action}:`, error);
        await sendMessage(chat.id, '❌ An error occurred while processing your request.');
    }
});