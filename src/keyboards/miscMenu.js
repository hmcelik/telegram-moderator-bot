import config from '../config/index.js';

export const miscKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: `Mute Duration (current: ${config.muteDurationMinutes} mins)`, callback_data: 'set_mute_duration' }],
            // Add more misc settings here
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});