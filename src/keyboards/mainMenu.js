/**
 * @fileoverview Defines the main inline keyboard for the settings panel.
 */

/**
 * The main settings keyboard layout.
 * This is the root menu that provides access to all other configuration categories.
 *
 * @type {object}
 */
export const mainKeyboard = {
    reply_markup: {
        inline_keyboard: [
            // Navigate to AI sensitivity settings.
            [{ text: '🧠 AI Sensitivity', callback_data: 'settings_ai_sensitivity' }],
            // Navigate to penalty level settings.
            [{ text: '⚖️ Penalty Levels', callback_data: 'settings_penalty_levels' }],
            // Navigate to whitelist management (keywords and moderators).
            [{ text: '🚫 Whitelist Management', callback_data: 'settings_whitelist' }],
            // Navigate to miscellaneous settings.
            [{ text: '⚙️ Miscellaneous', callback_data: 'settings_misc' }],
        ],
    },
};