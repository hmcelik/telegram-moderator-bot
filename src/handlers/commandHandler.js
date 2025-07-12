/**
 * @fileoverview Handles incoming commands from the admin user (e.g., /start, /settings, /status).
 */

import { sendMessage } from '../services/telegram.js';
import { mainKeyboard } from '../keyboards/mainMenu.js';
import * as db from '../services/database.js';
import config from '../config/index.js';
import { setActiveMenu } from './callbackHandler.js'; // Import state manager

// Ensure only the designated admin can use commands.
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/**
 * Processes and responds to recognized commands.
 *
 * @param {object} msg - The Telegram message object.
 */
export const handleCommand = async (msg) => {
    const { from, chat, text } = msg;

    // Security check: Only respond to the admin.
    if (from.id.toString() !== ADMIN_USER_ID) {
        return;
    }

    const [command] = text.split(' ');

    switch (command) {
        case '/start':
        case '/settings':
            // Send the main settings menu.
            const sentMenuMessage = await sendMessage(chat.id, 'Welcome to the bot settings panel. Please choose a category.', mainKeyboard);
            // Initialize the active menu state with this new message.
            setActiveMenu(sentMenuMessage);
            break;

        case '/status':
            // Compile and send a status report with the current configuration.
            const deletionsToday = await db.getTotalDeletionsToday();
            const response = `**📊 Bot Status & Configuration**

**⚖️ Penalty Levels** (\`0\` = disabled)
- Alert on Strike: \`${config.alertLevel}\`
- Mute on Strike: \`${config.muteLevel}\`
- Kick on Strike: \`${config.kickLevel}\`
- Ban on Strike: \`${config.banLevel}\`

**🧠 AI & Content**
- Spam Threshold: \`${config.spamThreshold}\`
- Keyword Bypass Mode: \`${config.keywordWhitelistBypass ? 'ON' : 'OFF'}\`

**⚙️ Other Settings**
- Mute Duration: \`${config.muteDurationMinutes} minutes\`
- Whitelisted Keywords: \`${config.whitelistedKeywords.join(', ') || 'None'}\`
- Manual User Whitelist: \`${config.moderatorIds.join(', ') || 'None'}\`

**📈 Stats**
- Deletions Today: \`${deletionsToday}\``;
            await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
            break;

        default:
            // Handle unrecognized commands.
            await sendMessage(chat.id, 'Unknown command. Use /settings to configure the bot.');
            break;
    }
};