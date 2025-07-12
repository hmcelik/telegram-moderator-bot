import { sendMessage } from '../services/telegram.js';
import { mainKeyboard } from '../keyboards/mainMenu.js';
import * as db from '../services/database.js';
import config from '../config/index.js';
import { setActiveMenu } from './callbackHandler.js'; // <-- Import the new state manager

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export const handleCommand = async (msg) => {
    const { from, chat, text } = msg;

    if (from.id.toString() !== ADMIN_USER_ID) {
        return;
    }

    const [command] = text.split(' ');

    switch (command) {
        case '/start':
        case '/settings':
            // Send the initial menu message
            const sentMenuMessage = await sendMessage(chat.id, 'Welcome to the bot settings panel. Please choose a category.', mainKeyboard);
            // --- NEW: Initialize the active menu state ---
            setActiveMenu(sentMenuMessage);
            break;

        case '/status':
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
            await sendMessage(chat.id, 'Unknown command. Use /settings to configure the bot.');
            break;
    }
};