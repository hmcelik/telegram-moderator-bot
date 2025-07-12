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

const userState = new Map();

export const handleCallback = async (callbackQuery) => {
    const { from, message, data } = callbackQuery;
    const [action] = data.split(':');

    if (from.id.toString() !== ADMIN_USER_ID) {
        await answerCallbackQuery(callbackQuery.id, { text: 'You are not authorized.' });
        return;
    }

    logger.info(`Admin callback: ${data}`);

    try {
        switch (action) {
            // Main Menu Navigation
            case 'settings_main':
                await editMessageText('Welcome to the bot settings panel. Please choose a category.', { chat_id: message.chat.id, message_id: message.message_id, ...mainKeyboard });
                break;
            case 'settings_ai_sensitivity':
                await editMessageText('Configure AI sensitivity settings:', { chat_id: message.chat.id, message_id: message.message_id, ...aiSensitivityKeyboard() });
                break;
            case 'settings_penalty_levels':
                await editMessageText('Configure penalty level settings:', { chat_id: message.chat.id, message_id: message.message_id, ...penaltyLevelsKeyboard() });
                break;
            case 'settings_whitelist':
                await editMessageText('Manage keyword and user whitelists:', { chat_id: message.chat.id, message_id: message.message_id, ...whitelistKeyboard });
                break;
            case 'settings_misc':
                await editMessageText('Configure miscellaneous settings:', { chat_id: message.chat.id, message_id: message.message_id, ...miscKeyboard() });
                break;

            // Whitelist Sub-Menu Navigation
            case 'whitelist_keywords':
                await editMessageText('Manage whitelisted keywords that bypass AI checks.', { chat_id: message.chat.id, message_id: message.message_id, ...keywordMenuKeyboard });
                break;
            case 'whitelist_mods':
                await editMessageText('Manage whitelisted moderator IDs.', { chat_id: message.chat.id, message_id: message.message_id, ...moderatorMenuKeyboard });
                break;

            // Actions requiring text input
            case 'set_threshold':
            case 'set_alert_level':
            case 'set_mute_level':
            case 'set_kick_level':
            case 'set_ban_level':
            case 'set_mute_duration':
            case 'add_keyword':
            case 'remove_keyword':
            case 'add_mod':
            case 'remove_mod':
                userState.set(from.id, { action: data, message_id: message.message_id });
                await sendMessage(message.chat.id, `Please send the value for this action.`);
                break;

            // List Actions
            case 'list_keywords':
                const keywords = await db.getWhitelistKeywords();
                const keywordList = keywords.length > 0 ? keywords.join('\n- ') : 'No keywords whitelisted.';
                await sendMessage(message.chat.id, `**📜 Whitelisted Keywords:**\n- ${keywordList}`, { parse_mode: 'Markdown'});
                break;
            case 'list_mods':
                const mods = config.moderatorIds;
                const mod_list = mods.length > 0 ? mods.join('\n- ') : 'No manual moderators.';
                await sendMessage(message.chat.id, `**👥 Whitelisted Moderator IDs:**\n- ${mod_list}`, { parse_mode: 'Markdown'});
                break;

            // Toggle Actions
            case 'toggle_bypass':
                const newBypassValue = !config.keywordWhitelistBypass;
                await updateSetting('keywordWhitelistBypass', newBypassValue);
                await answerCallbackQuery(callbackQuery.id, { text: `Keyword Bypass is now ${newBypassValue ? 'ON' : 'OFF'}` });
                await editMessageText('Configure AI sensitivity settings:', { chat_id: message.chat.id, message_id: message.message_id, ...aiSensitivityKeyboard() });
                break;
        }
        await answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        if (error.response && error.response.body.description.includes('message is not modified')) {
            logger.warn('Ignoring "message is not modified" error.');
            await answerCallbackQuery(callbackQuery.id);
        } else {
            logger.error('Error in callback handler:', error);
            await answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
        }
    }
};

bot.on('text', async (msg) => {
    const { from, text, chat } = msg;

    if (userState.has(from.id)) {
        const { action, message_id } = userState.get(from.id);
        userState.delete(from.id);

        try {
            let responseMessage = '✅ Success!';
            let shouldRefreshMenu = false;

            if (action.startsWith('set_')) {
                shouldRefreshMenu = true; // Only refresh for settings that change button text
                const settingKey = action === 'set_threshold' ? 'spamThreshold' : action === 'set_mute_duration' ? 'muteDurationMinutes' : `${action.split('_')[1]}Level`;
                const value = settingKey === 'spamThreshold' ? parseFloat(text) : parseInt(text, 10);

                if (isNaN(value)) {
                    await sendMessage(chat.id, 'Invalid number. Please try again.');
                    return;
                }
                await updateSetting(settingKey, value);
                responseMessage = `✅ **${settingKey}** updated to **${value}**.`;

            } else if (action === 'add_keyword') {
                await db.addWhitelistKeyword(text.toLowerCase());
                responseMessage = `✅ Keyword "${text}" added.`;
            } else if (action === 'remove_keyword') {
                await db.removeWhitelistKeyword(text.toLowerCase());
                responseMessage = `✅ Keyword "${text}" removed.`;
            } else if (action === 'add_mod') {
                const newMods = [...config.moderatorIds, text];
                await updateSetting('moderatorIds', newMods);
                responseMessage = `✅ Moderator ID ${text} added.`;
            } else if (action === 'remove_mod') {
                const newMods = config.moderatorIds.filter(id => id !== text);
                await updateSetting('moderatorIds', newMods);
                responseMessage = `✅ Moderator ID ${text} removed.`;
            }

            await loadSettingsFromDb(); // Ensure config is fresh
            await sendMessage(chat.id, responseMessage, { parse_mode: 'Markdown' });

            // --- FIX ---
            // Only refresh if it's a setting with a dynamic button label.
            if (shouldRefreshMenu) {
                let menuText, newKeyboard;
                if (action.includes('level') || action.includes('duration') || action.includes('threshold')) {
                    if (action.includes('threshold')) {
                        menuText = 'Configure AI sensitivity settings:'; newKeyboard = aiSensitivityKeyboard();
                    } else if (action.includes('duration')) {
                        menuText = 'Configure miscellaneous settings:'; newKeyboard = miscKeyboard();
                    } else {
                        menuText = 'Configure penalty level settings:'; newKeyboard = penaltyLevelsKeyboard();
                    }
                }
                
                if (menuText && newKeyboard && message_id) {
                    await editMessageText(menuText, { chat_id: chat.id, message_id: message_id, ...newKeyboard });
                }
            }

        } catch (error) {
            // Centralized error handling for the text listener
             if (error.response && error.response.body.description.includes('message is not modified')) {
                logger.warn('Ignoring "message is not modified" error during menu refresh.');
            } else {
                logger.error(`Failed to process text input for action ${action}:`, error);
                await sendMessage(chat.id, '❌ An error occurred while processing your request.');
            }
        }
    }
});