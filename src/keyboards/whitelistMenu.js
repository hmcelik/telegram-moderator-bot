export const whitelistKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: 'Manage Keywords', callback_data: 'whitelist_keywords' }],
            [{ text: 'Manage Moderators', callback_data: 'whitelist_mods' }],
            [{ text: '⬅️ Back to Main Menu', callback_data: 'settings_main' }],
        ],
    },
};