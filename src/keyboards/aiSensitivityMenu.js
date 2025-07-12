import config from '../config/index.js';

export const aiSensitivityKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: `Set Threshold (current: ${config.spamThreshold})`, callback_data: 'set_threshold' }],
            [{ text: `Toggle Bypass (current: ${config.keywordWhitelistBypass ? 'ON' : 'OFF'})`, callback_data: 'toggle_bypass' }],
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});