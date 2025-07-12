export const mainKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🧠 AI Sensitivity', callback_data: 'settings_ai_sensitivity' }],
            [{ text: '⚖️ Penalty Levels', callback_data: 'settings_penalty_levels' }],
            [{ text: '🚫 Whitelist Management', callback_data: 'settings_whitelist' }],
            [{ text: '⚙️ Miscellaneous', callback_data: 'settings_misc' }],
        ],
    },
};