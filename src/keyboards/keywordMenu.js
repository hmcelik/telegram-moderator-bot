export const keywordMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: 'Add Keyword', callback_data: 'add_keyword' }],
            [{ text: 'Remove Keyword', callback_data: 'remove_keyword' }],
            [{ text: 'List All Keywords', callback_data: 'list_keywords' }],
            [{ text: '⬅️ Back to Whitelist Menu', callback_data: 'settings_whitelist' }],
        ],
    },
};