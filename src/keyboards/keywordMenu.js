/**
 * @fileoverview Defines the inline keyboard for the Keyword Whitelist management menu.
 */

/**
 * The keyboard layout for managing whitelisted keywords.
 * Provides options to add, remove, and list keywords.
 *
 * @type {object}
 */
export const keywordMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            // Button to initiate adding a new keyword.
            [{ text: 'Add Keyword', callback_data: 'add_keyword' }],
            // Button to initiate removing an existing keyword.
            [{ text: 'Remove Keyword', callback_data: 'remove_keyword' }],
            // Button to list all currently whitelisted keywords.
            [{ text: 'List All Keywords', callback_data: 'list_keywords' }],
            // Navigation button to return to the main whitelist menu.
            [{ text: '⬅️ Back to Whitelist Menu', callback_data: 'settings_whitelist' }],
        ],
    },
};