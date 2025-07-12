/**
 * @fileoverview Defines the inline keyboard for the Miscellaneous settings menu.
 */

import config from '../config/index.js';

/**
 * Generates the miscellaneous settings keyboard layout.
 * This function ensures that the labels reflect the current configuration values.
 *
 * @returns {object} The keyboard layout object for the Telegram API.
 */
export const miscKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            // Button to set the duration of a mute penalty.
            [{ text: `Mute Duration (current: ${config.muteDurationMinutes} mins)`, callback_data: 'set_mute_duration' }],
            // Add more misc settings here in the future.
            // Navigation button to return to the main menu.
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});