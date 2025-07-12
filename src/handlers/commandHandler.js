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

**AI & Whitelist:**
- \`/set_threshold <0.1-1.0>\`
- \`/toggle_bypass\` (Toggle keyword whitelist bypass. Default: ON)
- \`/add_keyword <keyword>\`
- \`/remove_keyword <keyword>\`
- \`/list_keywords\`

**Penalty System:**
- \`/set_penalty <kick|ban>\`
- \`/set_strikes <number>\`
- \`/set_mute_duration <minutes>\`

**Other:**
- \`/status\`
- \`/add_mod <userId>\` (For non-admins)`;
            break;

        case '/status':
            const deletionsToday = await db.getTotalDeletionsToday();
            response = `**📊 Bot Status & Configuration**
**AI & Content:**
- Spam Threshold: \`${config.spamThreshold}\`
- Keyword Bypass Mode: \`${config.keywordWhitelistBypass ? 'ON' : 'OFF'}\` (If ON, AI is skipped for whitelisted words)

**Penalty System:**
- Final Penalty: \`${config.penaltyMode}\`
- Strikes to Penalty: \`${config.penaltyLevel}\`
- Mute Duration: \`${config.muteDurationMinutes} minutes\`

**Whitelists:**
- Keywords: \`${config.whitelistedKeywords.join(', ') || 'None'}\`
- Manual User Whitelist: \`${config.moderatorIds.join(', ') || 'None'}\``;
            break;

        case '/toggle_bypass':
            const newValue = !config.keywordWhitelistBypass;
            await updateSetting('keywordWhitelistBypass', newValue);
            response = `✅ Keyword Bypass mode is now **${newValue ? 'ON' : 'OFF'}**.`;
            if(newValue) {
                response += `\nMessages with whitelisted words will be completely ignored.`
            } else {
                response += `\nWhitelisted words will be sent to the AI for context.`
            }
            break;

        case '/add_keyword':
            const keywordToAdd = args[0]?.toLowerCase();
            if (keywordToAdd) {
                await db.addWhitelistKeyword(keywordToAdd);
                config.whitelistedKeywords.push(keywordToAdd);
                response = `✅ Keyword "${keywordToAdd}" added.`;
            } else {
                response = '❌ Please provide a keyword.';
            }
            break;

        case '/remove_keyword':
            const keywordToRemove = args[0]?.toLowerCase();
            if (keywordToRemove) {
                const index = config.whitelistedKeywords.indexOf(keywordToRemove);
                if (index > -1) {
                    await db.removeWhitelistKeyword(keywordToRemove);
                    config.whitelistedKeywords.splice(index, 1);
                    response = `✅ Keyword "${keywordToRemove}" removed.`;
                } else {
                    response = `❌ Keyword not found.`;
                }
            } else {
                response = '❌ Please provide a keyword.';
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
                response = '❌ Invalid threshold.';
            }
            break;

        case '/set_penalty':
            const mode = args[0]?.toLowerCase();
            if (Object.values(PenaltyMode).includes(mode)) {
                await updateSetting('penaltyMode', mode);
                response = `✅ Penalty mode set to ${mode}.`;
            } else {
                response = '❌ Invalid mode.';
            }
            break;

        case '/set_strikes':
            const level = parseInt(args[0], 10);
            if (!isNaN(level) && level > 1) {
                await updateSetting('penaltyLevel', level);
                response = `✅ Final penalty on strike #${level}.`;
            } else {
                response = '❌ Strike level must be > 1.';
            }
            break;

        case '/set_mute_duration':
            const duration = parseInt(args[0], 10);
            if (!isNaN(duration) && duration > 0) {
                await updateSetting('muteDurationMinutes', duration);
                response = `✅ Mute duration set to ${duration} minutes.`;
            } else {
                response = '❌ Invalid duration.';
            }
            break;

        case '/set_warning_message':
            const message = args.join(' ');
            if (message) {
                await updateSetting('warningMessage', message);
                response = `✅ Warning message updated.`;
            } else {
                response = '❌ Please provide a message.';
            }
            break;

        case '/add_mod':
            const modIdToAdd = args[0];
            if (modIdToAdd) {
                const newMods = [...config.moderatorIds, modIdToAdd];
                await updateSetting('moderatorIds', newMods);
                response = `✅ Manually whitelisted user ${modIdToAdd}.`;
            } else {
                response = '❌ Please provide a user ID.';
            }
            break;

        case '/remove_mod':
             const modIdToRemove = args[0];
            if (modIdToRemove) {
                const newMods = config.moderatorIds.filter(id => id !== modIdToRemove);
                await updateSetting('moderatorIds', newMods);
                response = `✅ Removed user ${modIdToRemove}.`;
            } else {
                response = '❌ Please provide a user ID.';
            }
            break;

        case '/list_mods':
            response = `**Manually Whitelisted Users:**\n${config.moderatorIds.join('\n') || 'None'}`;
            break;

        default:
            response = 'Unknown command. Use /help to see all available commands.';
            break;
    }

    await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
};