/**
 * @fileoverview Handles incoming commands from users (e.g., /start, /settings, /status).
 * Manages the initial interaction for bot configuration.
 */

import { sendMessage, getChatAdmins } from '../services/telegram.js';
import * as db from '../services/database.js';
import { getGroupSettings } from '../config/index.js';
import logger from '../services/logger.js';
import { mainKeyboard } from '../keyboards/mainMenu.js';
import { setActiveMenu } from './callbackHandler.js';

// The global "Super Admin" for bot-wide diagnostics.
const SUPER_ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/**
 * Processes and responds to recognized commands.
 *
 * @param {object} msg - The Telegram message object.
 */
export const handleCommand = async (msg) => {
    const { from, chat, text } = msg;
    const [command] = text.split(' ');

    // --- Super Admin Commands ---
    if (from.id.toString() === SUPER_ADMIN_USER_ID && command === '/broadcast') {
        const broadcastText = text.substring(command.length).trim();
        if (broadcastText) {
            const groups = await db.getAllGroups();
            for (const group of groups) {
                try {
                    await sendMessage(group.chatId, broadcastText);
                } catch (error) {
                    logger.error(`Failed to broadcast to group ${group.chatId}: ${error.message}`);
                }
            }
            await sendMessage(from.id, `Broadcast sent to ${groups.length} groups.`);
        } else {
            await sendMessage(from.id, "Please provide a message to broadcast.");
        }
        return;
    }


    // --- Group-Specific Commands ---
    if (chat.type === 'private') {
        // --- Commands in Private Chat ---
        switch (command) {
            case '/start':
            case '/settings':
                await showGroupSelection(from.id, from.id);
                break;
            case '/status':
                await showGroupSelection(from.id, from.id, 'status');
                break;
            default:
                await sendMessage(chat.id, 'Unknown command. Use /settings to manage a group or /status to check a group\'s status.');
                break;
        }
    } else {
        // --- Commands in a Group Chat ---
        
        // Register a group in the bot's database
        if (command === '/register') {
            try {
                // Check if the user is an admin before allowing registration
                const adminIds = await getChatAdmins(chat.id);
                if (adminIds.includes(from.id)) {
                    await db.addGroup(chat.id.toString(), chat.title);
                    await sendMessage(chat.id, `✅ This group, "${chat.title}", has been successfully registered. Admins can now manage me via a private message.`);
                    logger.info(`Group ${chat.id} manually registered by admin ${from.id}.`);
                } else {
                    await sendMessage(chat.id, 'Only group admins can use the /register command.');
                }
            } catch (error) {
                logger.error(`Failed to register group ${chat.id}:`, error);
                await sendMessage(chat.id, 'An error occurred during registration.');
            }
            return;
        }
        
        // Any user can use /status in a group.
        if (command === '/status') {
            const groupSettings = await getGroupSettings(chat.id);
            const deletionsToday = await db.getTotalDeletionsToday(chat.id);
            const response = `**📊 Bot Status & Configuration for ${chat.title}**

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
            await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
        }
    }
};

/**
 * Displays a group selection menu to an admin in a private chat.
 *
 * @param {number} userId - The ID of the user requesting to manage settings.
 * @param {number} chatId - The ID of the private chat to send the menu to.
 * @param {string} [nextAction='settings'] - The action to perform after group selection ('settings' or 'status').
 */
async function showGroupSelection(userId, chatId, nextAction = 'settings') {
    try {
        const allGroups = await db.getAllGroups();
        const adminInGroups = [];

        // Check each group to see if the user is an admin.
        for (const group of allGroups) {
            const adminIds = await getChatAdmins(group.chatId);
            if (adminIds.includes(userId)) {
                adminInGroups.push(group);
            }
        }

        if (adminInGroups.length === 0) {
            await sendMessage(chatId, 'I couldn\'t find any groups where you are an admin and I am present.');
            return;
        }

        if (adminInGroups.length === 1) {
            // If admin in only one group, skip selection and go straight to the action.
            const group = adminInGroups[0];
            const groupSettings = await getGroupSettings(group.chatId);

            if (nextAction === 'status') {
                 const deletionsToday = await db.getTotalDeletionsToday(group.chatId);
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
                 await sendMessage(chatId, response, { parse_mode: 'Markdown' });
            } else {
                 const sentMenuMessage = await sendMessage(chatId, `Managing settings for **${group.chatTitle}**. Please choose a category.`, {
                    ...mainKeyboard,
                    parse_mode: 'Markdown'
                 });
                 // Initialize the active menu state with the target chat ID.
                 setActiveMenu(sentMenuMessage, `Managing settings for **${group.chatTitle}**.`, mainKeyboard, group.chatId);
            }
            return;
        }

        // If admin in multiple groups, show the selection keyboard.
        const keyboard = {
            reply_markup: {
                inline_keyboard: adminInGroups.map(group => ([{
                    text: group.chatTitle,
                    callback_data: `select_group:${group.chatId}:${nextAction}`
                }]))
            }
        };

        await sendMessage(chatId, 'You are an admin in multiple groups. Please choose which group you want to manage:', keyboard);

    } catch (error) {
        logger.error(`Error showing group selection for user ${userId}:`, error);
        await sendMessage(chatId, 'An error occurred while fetching your groups.');
    }
}