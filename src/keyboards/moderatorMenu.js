/**
 * @fileoverview Defines the inline keyboard for the Moderator Whitelist management menu.
 */

/**
 * The keyboard layout for managing whitelisted moderator IDs.
 * Provides options to add, remove, and list moderators.
 *
 * @type {object}
 */
export const moderatorMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            // Button to initiate adding a new moderator ID.
            [{ text: 'Add Moderator ID', callback_data: 'add_mod' }],
            // Button to initiate removing an existing moderator ID.
            [{ text: 'Remove Moderator ID', callback_data: 'remove_mod' }],
            // Button to list all currently whitelisted moderator IDs.
            [{ text: 'List All Moderators', callback_data: 'list_mods' }],
            // Navigation button to return to the main whitelist menu.
            [{ text: '⬅️ Back to Whitelist Menu', callback_data: 'settings_whitelist' }],
        ],
    },
};