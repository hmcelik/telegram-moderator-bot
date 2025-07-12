/**
 * @fileoverview Handles all interactions originating from inline keyboard buttons (callback queries).
 * This includes navigating menus, toggling settings, and initiating workflows for updating values.
 */

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

// Ensure the bot only responds to the designated admin.
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// A simple in-memory store for tracking pending admin actions, e.g., waiting for a new value.
const userState = new Map();

// Holds the state of the current active settings menu to allow for seamless updates.
let activeMenu = {
    messageId: null,
    chatId: null,
    text: '',
    keyboard: null,
};

/**
 * Sets or updates the state of the currently active menu message.
 * This allows the bot to restore the menu after an admin provides a value via text message.
 *
 * @param {object} message - The Telegram message object representing the menu.
 * @param {string} [text] - Optional: New text for the menu.
 * @param {object} [keyboard] - Optional: New keyboard markup for the menu.
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
 * It routes actions to the appropriate logic, such as navigating menus or
 * preparing the bot to receive a new setting value.
 *
 * @param {object} callbackQuery - The callback query object from the Telegram API.
 */
export const handleCallback = async (callbackQuery) => {
    const { from, message, data } = callbackQuery;
    const [action] = data.split(':');

    // Security check: Only the admin can interact with the settings.
    if (from.id.toString() !== ADMIN_USER_ID) {
        await answerCallbackQuery(callbackQuery.id, { text: 'You are not authorized.' });
        return;
    }

    logger.info(`Admin callback received: ${data}`);

    try {
        let text, keyboard;
        let isMenuNavigation = true; // Flag to determine if we are just switching menus.

        // Route callback data to the appropriate menu or action.
        switch (action) {
            // Menu Navigation
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

            // Direct Actions
            case 'list_keywords':
            case 'list_mods':
                isMenuNavigation = false;
                const isKeywords = action === 'list_keywords';
                const items = isKeywords ? await db.getWhitelistKeywords() : config.moderatorIds;
                const title = isKeywords ? '📜 Whitelisted Keywords' : '👥 Whitelisted Moderator IDs';
                const itemList = items.length > 0 ? items.map(item => `- \`${item}\``).join('\n') : `No ${isKeywords ? 'keywords' : 'moderators'} whitelisted.`;
                // Send a new message with the list.
                await sendMessage(message.chat.id, `**${title}**\n${itemList}`, { parse_mode: 'Markdown'});
                break;

            case 'toggle_bypass':
                const newBypassValue = !config.keywordWhitelistBypass;
                await updateSetting('keywordWhitelistBypass', newBypassValue);
                await answerCallbackQuery(callbackQuery.id, { text: `Keyword Bypass is now ${newBypassValue ? 'ON' : 'OFF'}` });
                // Refresh the AI Sensitivity menu to show the new state.
                text = 'Configure AI sensitivity settings:';
                keyboard = aiSensitivityKeyboard();
                break;

            // Default case: Action requires user input (e.g., 'set_threshold')
            default:
                isMenuNavigation = false;
                // Set the user's state to indicate we are waiting for their input.
                userState.set(from.id, { action: data });
                // Edit the current menu to be a prompt for the new value.
                await editMessageText(`Please send the new value for **${action.replace(/_/g, ' ')}**.`, {
                    chat_id: message.chat.id,
                    message_id: message.message_id,
                    reply_markup: { inline_keyboard: [] }, // Remove buttons
                    parse_mode: 'Markdown'
                });
                break;
        }

        // If it was a menu navigation action, update the existing menu message.
        if (isMenuNavigation) {
            await editMessageText(text, {
                chat_id: message.chat.id,
                message_id: message.message_id,
                ...keyboard,
                parse_mode: 'Markdown'
            });
            // Update the active menu state to reflect the new menu.
            setActiveMenu(message, text, keyboard);
        }
        // Acknowledge the callback query to remove the "loading" state on the button.
        await answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        // Gracefully handle cases where the message is not modified, which is not a critical error.
        if (error.response && error.response.body?.description.includes('message is not modified')) {
            logger.warn('Ignoring "message is not modified" error.');
        } else {
            logger.error('Error in callback handler:', error);
            await answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
        }
    }
};

/**
 * A global listener for text messages, specifically to process pending admin inputs.
 * This is triggered after an admin clicks a button like "Set Threshold" and then sends a message with the new value.
 */
bot.on('text', async (msg) => {
    const { from, text, chat } = msg;

    // Ignore messages that are not from the admin or if there's no pending action.
    if (from.id.toString() !== ADMIN_USER_ID || !userState.has(from.id)) {
        return;
    }
    
    // Retrieve and clear the pending action for the user.
    const { action } = userState.get(from.id);
    userState.delete(from.id);

    try {
        let responseMessage = '✅ Success!';

        // Process settings updates based on the stored action.
        if (action.startsWith('set_')) {
            const settingKey = action === 'set_threshold' ? 'spamThreshold' : action === 'set_mute_duration' ? 'muteDurationMinutes' : `${action.split('_')[1]}Level`;
            const value = settingKey === 'spamThreshold' ? parseFloat(text) : parseInt(text, 10);
            if (isNaN(value)) {
                responseMessage = '❌ Invalid number provided.';
            } else {
                await updateSetting(settingKey, value);
                responseMessage = `✅ **${settingKey}** updated to **${value}**.`;
            }
        // Process keyword additions/removals.
        } else if (action.includes('keyword')) {
            const keyword = text.toLowerCase();
            if (action === 'add_keyword') await db.addWhitelistKeyword(keyword); else await db.removeWhitelistKeyword(keyword);
            responseMessage = `✅ Keyword **"${keyword}"** action completed.`;
        // Process moderator additions/removals.
        } else if (action.includes('mod')) {
            const modId = text;
            let newMods = [...config.moderatorIds];
            if (action === 'add_mod' && !newMods.includes(modId)) {
                newMods.push(modId);
            } else if (action === 'remove_mod') {
                newMods = newMods.filter(id => id !== modId);
            }
            await updateSetting('moderatorIds', newMods);
            responseMessage = `✅ Moderator ID **${modId}** action completed.`;
        }

        // Reload all settings from the database to ensure the config is fresh.
        await loadSettingsFromDb();
        await sendMessage(chat.id, responseMessage, { parse_mode: 'Markdown' });

        // Restore the correct menu with updated data.
        if (activeMenu.text && activeMenu.keyboard) {
            let menuText = activeMenu.text;
            let keyboard = activeMenu.keyboard;

            // Determine which menu to restore based on the action taken. This ensures
            // the menu reflects the newly updated values.
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

            // Send a new message with the restored menu.
            const newMenuMessage = await sendMessage(chat.id, menuText, keyboard);
            // Update the active menu to this new message.
            setActiveMenu(newMenuMessage, menuText, keyboard);

        }

    } catch (error) {
        logger.error(`Failed to process text input for action ${action}:`, error);
        await sendMessage(chat.id, '❌ An error occurred while processing your request.');
    }
});