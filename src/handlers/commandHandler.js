import { PenaltyMode } from '../utils/enums.js';
import config, { updateSetting } from '../config/index.js';
import * as db from '../services/database.js';
import { sendMessage } from '../services/telegram.js';
import logger from '../services/logger.js';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export const handleCommand = async (msg) => {
    const { from, chat, text } = msg;

    if (from.id.toString() !== ADMIN_USER_ID || chat.type !== 'private') {
        return;
    }

    const [command, ...args] = text.split(' ');
    let response = 'Unknown command. Use /help to see all available commands.';

    switch (command) {
        case '/help':
            response = `**🤖 Admin Command Center**
Admins are whitelisted automatically.

**Penalty Settings:**
- \`/set_penalty <kick|ban>\`
- \`/set_strikes <number>\`
- \`/set_mute_duration <minutes>\`
- \`/set_warning_message <message>\`

**Whitelist Management:**
- \`/add_mod <userId>\` (For non-admins)
- \`/add_keyword <keyword>\` (e.g., dogetoken)
- \`/remove_keyword <keyword>\`
- \`/list_keywords\`

**Core Settings:**
- \`/status\`
- \`/set_threshold <0.1-1.0>\``;
            break;

        case '/status':
            const deletionsToday = await db.getTotalDeletionsToday();
            response = `**📊 Bot Status & Configuration**

**Info:**
- Group admins are automatically whitelisted.

**Penalty System:**
- Final Penalty: \`${config.penaltyMode}\`
- Strikes to Penalty: \`${config.penaltyLevel}\`
- Mute Duration (2nd strike): \`${config.muteDurationMinutes} minutes\`

**AI & Content:**
- Spam Threshold: \`${config.spamThreshold}\`
- 1st Strike Warning: \`"${config.warningMessage}"\`

**Manual Whitelist (Non-Admins):**
- Manually Added IDs: \`${config.moderatorIds.join(', ') || 'None'}\`

**Keyword Whitelist:**
- Keywords: \`${config.whitelistedKeywords.join(', ') || 'None'}\``;
            break;

        case '/add_keyword':
            const keywordToAdd = args[0]?.toLowerCase();
            if (keywordToAdd) {
                await db.addWhitelistKeyword(keywordToAdd);
                config.whitelistedKeywords.push(keywordToAdd); // Update live config
                response = `✅ Keyword "${keywordToAdd}" added to the whitelist.`;
            } else {
                response = '❌ Please provide a keyword to add.';
            }
            break;

        case '/remove_keyword':
            const keywordToRemove = args[0]?.toLowerCase();
            if (keywordToRemove) {
                const index = config.whitelistedKeywords.indexOf(keywordToRemove);
                if (index > -1) {
                    await db.removeWhitelistKeyword(keywordToRemove);
                    config.whitelistedKeywords.splice(index, 1); // Update live config
                    response = `✅ Keyword "${keywordToRemove}" removed from the whitelist.`;
                } else {
                    response = `❌ Keyword "${keywordToRemove}" not found in whitelist.`;
                }
            } else {
                response = '❌ Please provide a keyword to remove.';
            }
            break;

        case '/list_keywords':
            response = `**Whitelisted Keywords:**\n- ${config.whitelistedKeywords.join('\n- ') || 'None'}`;
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
                response = `✅ Manually whitelisted user ${modIdToAdd}.`;
            } else {
                response = '❌ Invalid or duplicate user ID.';
            }
            break;

        case '/remove_mod':
            const modIdToRemove = args[0];
            if (modIdToRemove && config.moderatorIds.includes(modIdToRemove)) {
                const newMods = config.moderatorIds.filter(id => id !== modIdToRemove);
                await updateSetting('moderatorIds', newMods);
                response = `✅ Removed user ${modIdToRemove} from manual whitelist.`;
            } else {
                response = '❌ User ID not found in manual whitelist.';
            }
            break;

        case '/list_mods':
            response = `**Manually Whitelisted Users (Non-Admins):**\n${config.moderatorIds.join('\n') || 'None'}`;
            break;

        default:
            response = 'Unknown command. Use /help to see all available commands.';
            break;
    }

    await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
};