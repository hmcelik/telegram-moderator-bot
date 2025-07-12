export const moderatorMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: 'Add Moderator ID', callback_data: 'add_mod' }],
            [{ text: 'Remove Moderator ID', callback_data: 'remove_mod' }],
            [{ text: 'List All Moderators', callback_data: 'list_mods' }],
            [{ text: '⬅️ Back to Whitelist Menu', callback_data: 'settings_whitelist' }],
        ],
    },
};