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

    // This switch handles the primary commands that have more complex responses.
    switch (command) {
        case '/help':
            response = `**🤖 Bot Command Center**

Here are the commands to configure and manage the bot. Admins are automatically whitelisted from spam checks. Set a level to \`0\` to disable an action.

**⚖️ Penalty Level Commands**
- \`/set_alert_level <strike_num>\`
  *Warns the user in chat.*
- \`/set_mute_level <strike_num>\`
  *Mutes the user.*
- \`/set_kick_level <strike_num>\`
  *Kicks the user (can rejoin).*
- \`/set_ban_level <strike_num>\`
  *Bans the user (permanent).*

**🧠 AI & Whitelist Commands**
- \`/set_threshold <0.1-1.0>\`
  *Sets the AI's sensitivity. Higher is stricter.*
- \`/toggle_bypass\`
  *Toggles Keyword Bypass Mode. If ON, messages with a whitelisted keyword will skip the AI check entirely.*
- \`/add_keyword <keyword>\`
  *Adds a word to the whitelist (e.g., \`shiba\`).*
- \`/remove_keyword <keyword>\`
- \`/list_keywords\`

**⚙️ Other Settings**
- \`/set_mute_duration <minutes>\`
- \`/add_mod <userId>\`
  *Manually whitelists a non-admin user.*
- \`/remove_mod <userId>\`
- \`/list_mods\`
- \`/status\`
  *View the bot's current configuration and stats.*`;
            break;

        case '/status':
            const deletionsToday = await db.getTotalDeletionsToday();
            response = `**📊 Bot Status & Configuration**

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
            break;

        // For all other commands, use the helper function to keep this switch clean.
        default:
             response = await handleOtherCommands(command, args);
             break;
    }
    await sendMessage(chat.id, response, { parse_mode: 'Markdown' });
};

/**
 * Helper function to process all other commands.
 * @param {string} command The command to process.
 * @param {string[]} args The arguments for the command.
 * @returns {Promise<string>} The response message.
 */
async function handleOtherCommands(command, args) {
    let response;
    const levelCommandRegex = /^\/set_(alert|mute|kick|ban)_level$/;

    if (levelCommandRegex.test(command)) {
        const level = parseInt(args[0], 10);
        const type = command.match(levelCommandRegex)[1];
        const key = `${type}Level`;

        if (!isNaN(level) && level >= 0) {
            await updateSetting(key, level);
            response = `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} action will now trigger on strike #${level}. (0 means disabled)`;
        } else {
            response = '❌ Invalid input. Level must be a number (0 or greater).';
        }
        return response;
    }
    
    switch(command) {
        case '/toggle_bypass':
            const newValue = !config.keywordWhitelistBypass;
            await updateSetting('keywordWhitelistBypass', newValue);
            response = `✅ Keyword Bypass mode is now **${newValue ? 'ON' : 'OFF'}**.`;
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
            response = `**📜 Whitelisted Keywords:**\n- ${config.whitelistedKeywords.join('\n- ') || 'None'}`;
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
            response = `**👥 Manually Whitelisted Users:**\n\`${config.moderatorIds.join('\n') || 'None'}\``;
            break;
        default:
            response = 'Unknown command. Use /help.';
    }
    return response;
}