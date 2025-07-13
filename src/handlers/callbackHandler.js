/**
 * @fileoverview Handles all interactions originating from inline keyboard buttons (callback queries).
 * This includes navigating menus, toggling settings, and initiating workflows for updating values
 * on a per-group basis.
 */

import logger from '../services/logger.js';
import * as telegram from '../services/telegram.js';
import { mainKeyboard } from '../keyboards/mainMenu.js';
import { aiSensitivityKeyboard } from '../keyboards/aiSensitivityMenu.js';
import { penaltyLevelsKeyboard } from '../keyboards/penaltyLevelsMenu.js';
import { miscKeyboard } from '../keyboards/miscMenu.js';
import { whitelistKeyboard } from '../keyboards/whitelistMenu.js';
import { keywordMenuKeyboard } from '../keyboards/keywordMenu.js';
import { moderatorMenuKeyboard } from '../keyboards/moderatorMenu.js';
import { updateSetting, getGroupSettings } from '../config/index.js';
import * as db from '../services/database.js';
import bot from '../services/telegram.js';

// A simple in-memory store for tracking pending admin actions.
// Now stores { action, targetChatId }
const userState = new Map();

// Holds the state of the current active settings menu.
let activeMenu = {
    messageId: null,
    chatId: null,
    text: '',
    keyboard: null,
    targetChatId: null, // The group being configured
};

/**
 * Sets or updates the state of the currently active menu message.
 *
 * @param {object} message - The Telegram message object representing the menu.
 * @param {string} [text] - Optional: New text for the menu.
 * @param {object} [keyboard] - Optional: New keyboard markup for the menu.
 * @param {string} [targetChatId] - Optional: The ID of the group being configured.
 */
export const setActiveMenu = (message, text, keyboard, targetChatId) => {
    if (!message) return;
    activeMenu.messageId = message.message_id;
    activeMenu.chatId = message.chat.id;
    if (text) activeMenu.text = text;
    if (keyboard) activeMenu.keyboard = keyboard;
    if (targetChatId) activeMenu.targetChatId = targetChatId;
};

/**
 * Main handler for all incoming callback queries from inline keyboards.
 *
 * @param {object} callbackQuery - The callback query object from the Telegram API.
 */
export const handleCallback = async (callbackQuery) => {
    const { from, message, data } = callbackQuery;
    const [action, ...params] = data.split(':');

    logger.info(`Callback received from ${from.id}: ${data}`);

    try {
        let text, keyboard;
        let isMenuNavigation = true;
        let targetChatId = userState.get(from.id)?.targetChatId || activeMenu.targetChatId;

        if (action === 'select_group') {
            const [selectedChatId, nextAction] = params;
            userState.set(from.id, { targetChatId: selectedChatId });
            targetChatId = selectedChatId;
            const group = await db.getGroup(selectedChatId);
            const groupSettings = await getGroupSettings(targetChatId);

            if (!group) {
                await telegram.answerCallbackQuery(callbackQuery.id, { text: 'Error: Group not found.' });
                return;
            }

            if (nextAction === 'status') {
                 const deletionsToday = await db.getTotalDeletionsToday(targetChatId);
                 const response = `**📊 Bot Status & Configuration for ${group.chatTitle}**

**⚖️ Penalty Levels** (\`0\` = disabled)
- Alert on Strike: \`${groupSettings.alertLevel}\`
- Mute on Strike: \`${groupSettings.muteLevel}\`
- Kick on Strike: \`${groupSettings.kickLevel}\`
- Ban on Strike: \`${groupSettings.banLevel}\`

**🧠 AI & Content**
- Spam Threshold: \`${groupSettings.spamThreshold}\`
- Keyword Bypass Mode: \`${groupSettings.keywordWhitelistBypass ? 'ON' : 'OFF'}\`

**⚙️ Other Settings**
- Mute Duration: \`${groupSettings.muteDurationMinutes} minutes\`
- Whitelisted Keywords: \`${groupSettings.whitelistedKeywords.join(', ') || 'None'}\`
- Manual User Whitelist: \`${groupSettings.moderatorIds.join(', ') || 'None'}\`

**📈 Stats**
- Deletions Today: \`${deletionsToday}\``;
                 await telegram.editMessageText(response, { chat_id: message.chat.id, message_id: message.message_id, parse_mode: 'Markdown' });
                 await telegram.answerCallbackQuery(callbackQuery.id);
                 return;
            } else {
                 text = `Managing settings for **${group.chatTitle}**. Please choose a category.`;
                 keyboard = mainKeyboard;
            }

        } else {
            if (!targetChatId) {
                logger.warn(`Callback handler invoked without a targetChatId for user ${from.id}`);
                await telegram.answerCallbackQuery(callbackQuery.id, { text: 'Your session expired. Please start with /settings again.' });
                return;
            }
            const groupSettings = await getGroupSettings(targetChatId);

            switch (action) {
                // Menu Navigation
                case 'settings_main':
                    const group = await db.getGroup(targetChatId);
                    text = `Managing settings for **${group.chatTitle}**. Please choose a category.`;
                    keyboard = mainKeyboard;
                    break;
                case 'settings_ai_sensitivity':
                    text = 'Configure AI sensitivity settings:';
                    keyboard = aiSensitivityKeyboard(groupSettings);
                    break;
                case 'settings_penalty_levels':
                    text = 'Configure penalty level settings:';
                    keyboard = penaltyLevelsKeyboard(groupSettings);
                    break;
                case 'settings_whitelist':
                    text = 'Manage keyword and user whitelists:';
                    keyboard = whitelistKeyboard;
                    break;
                case 'settings_misc':
                    text = 'Configure miscellaneous settings:';
                    keyboard = miscKeyboard(groupSettings);
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
                    const items = isKeywords ? groupSettings.whitelistedKeywords : groupSettings.moderatorIds;
                    const title = isKeywords ? '📜 Whitelisted Keywords' : '👥 Whitelisted Moderator IDs';
                    const itemList = items.length > 0 ? items.map(item => `- \`${item}\``).join('\n') : `No ${isKeywords ? 'keywords' : 'moderators'} whitelisted.`;
                    await telegram.sendMessage(message.chat.id, `**${title}**\n${itemList}`, { parse_mode: 'Markdown'});
                    break;

                case 'toggle_bypass':
                    const newBypassValue = !groupSettings.keywordWhitelistBypass;
                    await updateSetting(targetChatId, 'keywordWhitelistBypass', newBypassValue);
                    await telegram.answerCallbackQuery(callbackQuery.id, { text: `Keyword Bypass is now ${newBypassValue ? 'ON' : 'OFF'}` });
                    const updatedSettingsForBypass = await getGroupSettings(targetChatId);
                    text = 'Configure AI sensitivity settings:';
                    keyboard = aiSensitivityKeyboard(updatedSettingsForBypass);
                    break;

                // Default case: Action requires user input
                default:
                    isMenuNavigation = false;
                    userState.set(from.id, { action: data, targetChatId });
                    
                    let promptText = `Please send the new value for **${action.replace(/_/g, ' ')}**.`;
                    if (action === 'set_warning_message') {
                        promptText += "\n\nUse `{user}` as a placeholder to tag the user.";
                    }
                
                    await telegram.editMessageText(promptText, {
                        chat_id: message.chat.id,
                        message_id: message.message_id,
                        reply_markup: { inline_keyboard: [] },
                        parse_mode: 'Markdown'
                    });
                    break;
            }
        }

        if (isMenuNavigation) {
            await telegram.editMessageText(text, {
                chat_id: message.chat.id,
                message_id: message.message_id,
                ...keyboard,
                parse_mode: 'Markdown'
            });
            setActiveMenu(message, text, keyboard, targetChatId);
        }
        await telegram.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        if (error.response && error.response.body?.description.includes('message is not modified')) {
            logger.warn('Ignoring "message is not modified" error.');
        } else {
            logger.error(`Error in callback handler: ${error.message}`, { stack: error.stack });
            await telegram.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
        }
    }
};

/**
 * A global listener for text messages to process pending admin inputs.
 */
bot.on('text', async (msg) => {
    const { from, text, chat } = msg;

    if (!userState.has(from.id)) {
        return;
    }

    const { action, targetChatId } = userState.get(from.id);
    userState.delete(from.id);

    if (!targetChatId) {
        logger.error(`Text input received without a targetChatId from user ${from.id}.`);
        return;
    }

    try {
        let responseMessage = '✅ Success!';

        if (action.startsWith('set_')) {
            let settingKey;
            let value;
            
            switch (action) {
                case 'set_threshold':
                    settingKey = 'spamThreshold';
                    value = parseFloat(text);
                    break;
                case 'set_mute_duration':
                    settingKey = 'muteDurationMinutes';
                    value = parseInt(text, 10);
                    break;
                case 'set_warning_delete_seconds':
                    settingKey = 'warningMessageDeleteSeconds';
                    value = parseInt(text, 10);
                    break;
                case 'set_warning_message':
                    settingKey = 'warningMessage';
                    value = text;
                    break;
                default: // For penalty levels like set_alert_level
                    settingKey = `${action.split('_')[1]}Level`;
                    value = parseInt(text, 10);
                    break;
            }

            if (value === undefined || (typeof value === 'number' && isNaN(value))) {
                responseMessage = `❌ Invalid ${typeof value === 'number' ? 'number' : 'value'} provided.`;
            } else {
                await updateSetting(targetChatId, settingKey, value);
                responseMessage = `✅ **${settingKey.replace(/([A-Z])/g, ' $1').trim()}** updated successfully.`;
            }
        } else if (action.includes('keyword')) {
            const keyword = text.toLowerCase().trim();
            if (action === 'add_keyword') await db.addWhitelistKeyword(targetChatId, keyword);
            else await db.removeWhitelistKeyword(targetChatId, keyword);
            responseMessage = `✅ Keyword **"${keyword}"** action completed.`;
        } else if (action.includes('mod')) {
            const modId = text.trim();
            const groupSettings = await getGroupSettings(targetChatId);
            let newMods = [...groupSettings.moderatorIds];
            if (action === 'add_mod' && !newMods.includes(modId)) {
                newMods.push(modId);
            } else if (action === 'remove_mod') {
                newMods = newMods.filter(id => id !== modId);
            }
            await updateSetting(targetChatId, 'moderatorIds', newMods);
            responseMessage = `✅ Moderator ID **${modId}** action completed.`;
        }

        await telegram.sendMessage(chat.id, responseMessage, { parse_mode: 'Markdown' });

        // Restore the menu
        const updatedSettings = await getGroupSettings(targetChatId);
        const group = await db.getGroup(targetChatId);
        let menuText = `Managing settings for **${group.chatTitle}**.`;
        let keyboard;

        if (action.includes('threshold') || action.includes('bypass')) {
            menuText = 'Configure AI sensitivity settings:';
            keyboard = aiSensitivityKeyboard(updatedSettings);
        } else if (action.includes('duration') || action.includes('warning')) {
            menuText = 'Configure miscellaneous settings:';
            keyboard = miscKeyboard(updatedSettings);
        } else if (action.startsWith('set_') && action.includes('level')) {
            menuText = 'Configure penalty level settings:';
            keyboard = penaltyLevelsKeyboard(updatedSettings);
        } else if (action.includes('keyword')) {
            menuText = 'Manage whitelisted keywords that bypass AI checks.';
            keyboard = keywordMenuKeyboard;
        } else if (action.includes('mod')) {
            menuText = 'Manage whitelisted moderator IDs.';
            keyboard = moderatorMenuKeyboard;
        } else {
            menuText = `Managing settings for **${group.chatTitle}**. Please choose a category.`;
            keyboard = mainKeyboard;
        }

        const newMenuMessage = await telegram.sendMessage(chat.id, menuText, keyboard);
        setActiveMenu(newMenuMessage, menuText, keyboard, targetChatId);

    } catch (error) {
        logger.error(`Failed to process text input for action ${action}:`, error);
        await telegram.sendMessage(chat.id, '❌ An error occurred while processing your request.');
    }
});