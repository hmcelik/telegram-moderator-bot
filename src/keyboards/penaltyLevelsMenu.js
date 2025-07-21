/**
 * @fileoverview Defines the inline keyboard for the Penalty Levels settings menu.
 */

/**
 * Generates the penalty levels keyboard layout.
 * This function is called each time the menu is displayed to ensure the
 * labels reflect the current configuration values for each penalty level.
 *
 * @param {object} settings - The settings object for the group being configured.
 * @param {string} chatId - The ID of the group being configured.
 * @returns {object} The keyboard layout object for the Telegram API.
 */
export const penaltyLevelsKeyboard = (settings, chatId) => ({
    reply_markup: {
        inline_keyboard: [
            // Buttons to set the strike count for each penalty type.
            [{ text: `Alert Level (current: ${settings.alertLevel})`, callback_data: `set_alert_level:${chatId}` }],
            [{ text: `Mute Level (current: ${settings.muteLevel})`, callback_data: `set_mute_level:${chatId}` }],
            [{ text: `Kick Level (current: ${settings.kickLevel})`, callback_data: `set_kick_level:${chatId}` }],
            [{ text: `Ban Level (current: ${settings.banLevel})`, callback_data: `set_ban_level:${chatId}` }],
            // Navigation button to return to the main menu.
            [{ text: '⬅️ Back', callback_data: `settings_main:${chatId}` }],
        ],
    },
});