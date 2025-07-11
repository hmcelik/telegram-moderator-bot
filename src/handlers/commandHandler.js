import { PenaltyMode } from '../utils/enums.js';
import config, { updateSetting } from '../config/index.js';
import * as db from '../services/database.js';
import { sendMessage } from '../services/telegram.js';
import logger from '../services/logger.js';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export const handleCommand = async (msg) => {
    const { from, chat, text } = msg;

    // Ensure commands are only processed from the designated admin in a private chat
    if (from.id.toString() !== ADMIN_USER_ID || chat.type !== 'private') {
        if (chat.type !== 'private') {
             logger.warn(`Command attempt in non-private chat by user ${from.id}`);
        } else {
             logger.warn(`Unauthorized command attempt from user ${from.id}`);
        }
        return;
    }

    const [command, ...args] = text.split(' ');
    let response = 'Unknown command. Use /help to see all available commands.';

    switch (command) {
        case '/help':
            response = `**🤖 Admin Command Center**

Here are the commands to configure the bot.

**Penalty Settings:**
- \`/set_penalty <kick|ban>\`
  Sets the final action on the last strike.
- \`/set_strikes <number>\`
  Sets how many strikes trigger the final penalty (e.g., 3).
- \`/set_mute_duration <minutes>\`
  Sets how long a user is muted on their 2nd strike.
- \`/set_warning_message <message>\`
  Sets the warning text for the 1st strike. Use \`{user}\` to mention the user.

**Core Settings:**
- \`/status\`
  View current stats and all settings.
- \`/set_threshold <0.1-1.0>\`
  Set spam confidence score (e.g., 0.85). Higher is stricter.

**Moderator Management:**
- \`/add_mod <userId>\`
- \`/remove_mod <userId>\`
- \`/list_mods\``;
            break;

        case '/status':
            const deletionsToday = await db.getTotalDeletionsToday();
            response = `**📊 Bot Status & Configuration**

**Stats:**
- Deletions Today: \`${deletionsToday}\`

**Penalty System:**
- Final Penalty: \`${config.penaltyMode}\`
- Strikes to Penalty: \`${config.penaltyLevel}\`
- Mute Duration (2nd strike): \`${config.muteDurationMinutes} minutes\`

**AI & Content:**
- Spam Threshold: \`${config.spamThreshold}\`
- 1st Strike Warning: \`"${config.warningMessage}"\`

**Moderators:**
- Ignored IDs: \`${config.moderatorIds.join(', ') || 'None'}\``;
            break;

        case '/set_threshold':
            const threshold = parseFloat(args[0]);
            if (!isNaN(threshold) && threshold >= 0.1 && threshold <= 1.0) {
                await updateSetting('spamThreshold', threshold);
                response = `✅ Spam threshold updated to ${threshold}.`;
            } else {
                response = '❌ Invalid threshold. Must be a number between 0.1 and 1.0.';
            }
            break;
            
        case '/set_penalty':
            const mode = args[0]?.toLowerCase();
            if (Object.values(PenaltyMode).includes(mode)) {
                await updateSetting('penaltyMode', mode);
                response = `✅ Penalty mode set to ${mode}.`;
            } else {
                response = `❌ Invalid mode. Use "${PenaltyMode.KICK}" or "${PenaltyMode.BAN}".`;
            }
            break;

        case '/set_strikes':
            const level = parseInt(args[0], 10);
            if (!isNaN(level) && level > 1) {
                await updateSetting('penaltyLevel', level);
                response = `✅ Final penalty will now be applied on strike number ${level}.`;
            } else {
                response = '❌ Invalid number. Must be an integer greater than 1.';
            }
            break;

        case '/set_mute_duration':
            const duration = parseInt(args[0], 10);
            if (!isNaN(duration) && duration > 0) {
                await updateSetting('muteDurationMinutes', duration);
                response = `✅ Mute duration for 2nd strike set to ${duration} minutes.`;
            } else {
                response = '❌ Invalid duration. Must be a positive number of minutes.';
            }
            break;

        case '/set_warning_message':
            const message = args.join(' ');
            if (message) {
                await updateSetting('warningMessage', message);
                response = `✅ Warning message updated to: "${message}"`;
            } else {
                response = '❌ Please provide a message after the command.';
            }
            break;

        case '/add_mod':
            const modIdToAdd = args[0];
            if (modIdToAdd && !config.moderatorIds.includes(modIdToAdd)) {
                const newMods = [...config.moderatorIds, modIdToAdd];
                await updateSetting('moderatorIds', newMods);
                response = `✅ Moderator ${modIdToAdd} added.`;
            } else {
                response = '❌ Invalid or duplicate moderator ID.';
            }
            break;

        case '/remove_mod':
             const modIdToRemove = args[0];
            if (modIdToRemove && config.moderatorIds.includes(modIdToRemove)) {
                const newMods = config.moderatorIds.filter(id => id !== modIdToRemove);
                await updateSetting('moderatorIds', newMods);
                response = `✅ Moderator ${modIdToRemove} removed.`;
            } else {
                response = '❌ Moderator ID not found.';
            }
            break;

        case '/list_mods':
            response = `**Current Moderator IDs:**\n${config.moderatorIds.join('\n') || 'None'}`;
            break;
    }

    // Send the response using Markdown for better formatting
    await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
};