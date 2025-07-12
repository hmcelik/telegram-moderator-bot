import config from '../config/index.js';

export const penaltyLevelsKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: `Alert Level (current: ${config.alertLevel})`, callback_data: 'set_alert_level' }],
            [{ text: `Mute Level (current: ${config.muteLevel})`, callback_data: 'set_mute_level' }],
            [{ text: `Kick Level (current: ${config.kickLevel})`, callback_data: 'set_kick_level' }],
            [{ text: `Ban Level (current: ${config.banLevel})`, callback_data: 'set_ban_level' }],
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});