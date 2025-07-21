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
import { escapeMarkdownV2 } from './commandHandler.js';

// A simple in-memory store for tracking pending admin actions.
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
            
            if (!group) {
                await telegram.answerCallbackQuery(callbackQuery.id, { text: 'Error: Group not found.' });
                return;
            }

            if (nextAction === 'status') {
                 const groupSettings = await getGroupSettings(targetChatId);
                 const deletionsToday = await db.getTotalDeletionsToday(targetChatId);
                 const response = `**📊 Bot Status & Configuration for ${group.chatTitle}**\n\n**⚖️ Penalty Levels** (\`0\` = disabled)\n- Alert on Strike: \`${groupSettings.alertLevel}\`\n- Mute on Strike: \`${groupSettings.muteLevel}\`\n- Kick on Strike: \`${groupSettings.kickLevel}\`\n- Ban on Strike: \`${groupSettings.banLevel}\`\n\n**🧠 AI & Content**\n- Spam Threshold: \`${groupSettings.spamThreshold}\`\n- Keyword Bypass Mode: \`${groupSettings.keywordWhitelistBypass ? 'ON' : 'OFF'}\`\n\n**⚙️ Other Settings**\n- Mute Duration: \`${groupSettings.muteDurationMinutes} minutes\`\n- Whitelisted Keywords: \`${groupSettings.whitelistedKeywords.join(', ') || 'None'}\`\n- Manual User Whitelist: \`${groupSettings.moderatorIds.join(', ') || 'None'}\`\n\n**📈 Stats**\n- Deletions Today: \`${deletionsToday}\``;
                 await telegram.editMessageText(response, { chat_id: message.chat.id, message_id: message.message_id, parse_mode: 'Markdown' });
                 await telegram.answerCallbackQuery(callbackQuery.id);
                 return;
            } else if (nextAction === 'mystrikes') {
                isMenuNavigation = false;
                const strikes = await db.getStrikes(targetChatId, from.id.toString());
                const history = await db.getStrikeHistory(targetChatId, from.id.toString(), 10);
                let report = `⚖️ *Your Strike Report*\n*Group:* ${escapeMarkdownV2(group.chatTitle)}\n*Current Strikes:* ${strikes.count}\n`;
                if (history.length > 0) {
                    report += `\n*Recent History:*\n\\(Showing last ${history.length} actions\\)\n`;
                    for (const record of history) {
                        report += `\n─────────────────────\n`;
                        const logData = JSON.parse(record.logData);
                        const timestamp = new Date(record.timestamp).toLocaleString('en-GB', { timeZone: 'UTC' });
                        const actionType = logData.type || 'AUTO';
                        if (actionType.startsWith('MANUAL')) {
                            let actionDetail = logData.type;
                            if (logData.type === 'MANUAL-STRIKE-ADD') actionDetail = `Added ${logData.amount} strike(s)`;
                            else if (logData.type === 'MANUAL-STRIKE-REMOVE') actionDetail = `Removed ${logData.amount} strike(s)`;
                            else if (logData.type === 'MANUAL-STRIKE-SET') actionDetail = `Set strikes to ${logData.amount}`;
                            report += `🛡️ *Action:* ${escapeMarkdownV2(actionDetail)}\n`;
                            report += `👮 *Admin:* ${escapeMarkdownV2(logData.admin.first_name)}\n`;
                            report += `📅 *Date:* ${escapeMarkdownV2(timestamp)}\n`;
                            report += `💬 *Reason:* "${escapeMarkdownV2(logData.reason)}"\n`;
                        } else {
                            report += `🔥 *Action:* AUTO\\-STRIKE\n`;
                            report += `📅 *Date:* ${escapeMarkdownV2(timestamp)}\n`;
                            report += `💬 *Reason:* "${escapeMarkdownV2(logData.messageExcerpt)}"\n`;
                        }
                    }
                } else {
                    report += "\n_You have no strike history in the audit log\\._\n";
                }
                await telegram.editMessageText(report, { chat_id: message.chat.id, message_id: message.message_id, parse_mode: 'MarkdownV2' });
            } else { // Default to settings
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

                case 'list_keywords':
                case 'list_mods':
                    isMenuNavigation = false;
                    const isKeywords = action === 'list_keywords';
                    const items = isKeywords ? await db.getWhitelistKeywords(targetChatId) : (await getGroupSettings(targetChatId)).moderatorIds;
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

                default:
                    isMenuNavigation = false;
                    userState.set(from.id, { action: data, targetChatId });
                    
                    let promptText = `Please send the new value.`;
                    if (action.startsWith('set_')) {
                        promptText = `Please send the new value for **${action.replace(/_/g, ' ')}**.`;
                    } else if (action === 'add_keyword') {
                        promptText = "Please send the keyword you want to add to the whitelist.";
                    } else if (action === 'remove_keyword') {
                        promptText = "Please send the keyword you want to remove.";
                    } else if (action === 'add_mod') {
                        promptText = "Please send the numeric User ID of the moderator to add.";
                    } else if (action === 'remove_mod') {
                        promptText = "Please send the numeric User ID of the moderator to remove.";
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

    if (!targetChatId || !action) {
        // This is not a critical error, just a message that was not meant for the bot's workflow.
        // We log it as a warning for debugging but don't crash.
        logger.warn(`Text input received without a valid state for user ${from.id}. Action: ${action}`);
        return;
    }

    try {
        let responseMessage = '✅ Success!';
        let settingKey, value;

        if (action.startsWith('set_')) {
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
                case 'set_strike_expiration':
                    settingKey = 'strikeExpirationDays';
                    value = parseInt(text, 10);
                    break;
                case 'set_good_behavior':
                    settingKey = 'goodBehaviorDays';
                    value = parseInt(text, 10);
                    break;
                default:
                    settingKey = `${action.split('_')[1]}Level`;
                    value = parseInt(text, 10);
                    break;
            }

            if (value === undefined || (typeof value === 'number' && isNaN(value))) {
                responseMessage = `❌ Invalid value provided.`;
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
            if (action === 'add_mod' && !newMods.includes(modId)) newMods.push(modId);
            else if (action === 'remove_mod') newMods = newMods.filter(id => id !== modId);
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
        } else if (action.includes('duration') || action.includes('warning') || action.includes('expiration') || action.includes('behavior')) {
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