/**
 * @fileoverview Defines the inline keyboard for the Penalty Levels settings menu.
 */

import config from '../config/index.js';

/**
 * Generates the penalty levels keyboard layout.
 * This function is called each time the menu is displayed to ensure the
 * labels reflect the current configuration values for each penalty level.
 *
 * @returns {object} The keyboard layout object for the Telegram API.
 */
export const penaltyLevelsKeyboard = () => ({
    reply_markup: {
        inline_keyboard: [
            // Buttons to set the strike count for each penalty type.
            [{ text: `Alert Level (current: ${config.alertLevel})`, callback_data: 'set_alert_level' }],
            [{ text: `Mute Level (current: ${config.muteLevel})`, callback_data: 'set_mute_level' }],
            [{ text: `Kick Level (current: ${config.kickLevel})`, callback_data: 'set_kick_level' }],
            [{ text: `Ban Level (current: ${config.banLevel})`, callback_data: 'set_ban_level' }],
            // Navigation button to return to the main menu.
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});