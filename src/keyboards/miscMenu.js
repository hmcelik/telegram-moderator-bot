/**
 * @fileoverview Defines the inline keyboard for the Miscellaneous settings menu.
 */

/**
 * Generates the miscellaneous settings keyboard layout.
 * This function ensures that the labels reflect the current configuration values.
 *
 * @param {object} settings - The settings object for the group being configured.
 * @returns {object} The keyboard layout object for the Telegram API.
 */
export const miscKeyboard = (settings) => ({
    reply_markup: {
        inline_keyboard: [
            [{ text: `Mute Duration (current: ${settings.muteDurationMinutes} mins)`, callback_data: 'set_mute_duration' }],
            [{ text: `Warning Deletion Timer (current: ${settings.warningMessageDeleteSeconds}s)`, callback_data: 'set_warning_delete_seconds' }],
            [{ text: 'Set Warning Message', callback_data: 'set_warning_message' }],
            [{ text: `Set Strike Expiration (current: ${settings.strikeExpirationDays} days)`, callback_data: 'set_strike_expiration' }],
            [{ text: `Good Behavior Forgiveness (current: ${settings.goodBehaviorDays} days)`, callback_data: 'set_good_behavior' }],
            [{ text: '⬅️ Back', callback_data: 'settings_main' }],
        ],
    },
});