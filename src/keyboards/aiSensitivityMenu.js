/**
 * @fileoverview Defines the inline keyboard for the AI Sensitivity settings menu.
 */

import config from '../config/index.js';

/**
 * Generates the AI sensitivity keyboard layout.
 * This function is called each time the menu is displayed to ensure the
 * labels reflect the current configuration values.
 *
 * @returns {object} The keyboard layout object for the Telegram API.
 */
export const aiSensitivityKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            // Button to set the spam detection threshold.
            [{ text: `Set Threshold (current: ${config.spamThreshold})`, callback_data: 'set_threshold' }],
            // Button to toggle the keyword bypass feature.
            [{ text: `Toggle Bypass (current: ${config.keywordWhitelistBypass ? 'ON' : 'OFF'})`, callback_data: 'toggle_bypass' }],
            // Navigation button to return to the main menu.
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});