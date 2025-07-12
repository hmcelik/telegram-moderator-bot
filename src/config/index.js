/**
 * @fileoverview Manages the application's configuration, loading settings from both
 * environment variables and a persistent database. It provides a centralized point
 * of access for all configuration parameters.
 */

import { PenaltyMode } from '../utils/enums.js';
import dotenv from 'dotenv';
import { getSetting, setSetting, getWhitelistKeywords } from '../services/database.js';

// Load environment variables from a .env file into process.env
dotenv.config();

/**
 * The main configuration object.
 *
 * This object holds all the settings for the application, including API keys,
 * database paths, and dynamic moderation parameters. Default values are defined here
 * and can be overridden by settings loaded from the database.
 *
 * @property {object} telegram - Telegram-related settings.
 * @property {string} telegram.token - The token for the Telegram Bot API.
 * @property {object} nlp - Natural Language Processing (OpenAI) settings.
 * @property {string} nlp.apiKey - The API key for the OpenAI service.
 * @property {object} database - Database-related settings.
 * @property {string} database.path - The file path for the SQLite database.
 * @property {number} alertLevel - The strike count at which a user receives an alert. `0` disables this penalty.
 * @property {number} muteLevel - The strike count at which a user is muted. `0` disables this penalty.
 * @property {number} kickLevel - The strike count at which a user is kicked from the chat. `0` disables this penalty.
 * @property {number} banLevel - The strike count at which a user is banned from the chat. `0` disables this penalty.
 * @property {number} spamThreshold - The AI's confidence score (0.0 to 1.0) required to classify a message as spam. Higher is stricter.
 * @property {number} muteDurationMinutes - The duration, in minutes, for which a user is muted.
 * @property {string} warningMessage - The template for the warning message sent to users.
 * @property {string[]} moderatorIds - A list of Telegram user IDs that are exempt from moderation.
 * @property {string[]} whitelistedKeywords - A list of keywords that, if present in a message, bypass the AI spam check.
 * @property {boolean} keywordWhitelistBypass - If `true`, messages containing whitelisted keywords are ignored.
 */
const config = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
    },
    nlp: {
        apiKey: process.env.OPENAI_API_KEY,
    },
    database: {
        path: process.env.DATABASE_PATH || './moderator.db',
    },
    // Dynamic Penalty Level Settings
    // Each action is triggered when a user's strike count reaches the specified level.
    // A value of 0 disables the penalty.
    alertLevel: 1,
    muteLevel: 2,
    kickLevel: 3,
    banLevel: 0, // Disabled by default for safety

    // Other configurable settings
    spamThreshold: 0.85,
    muteDurationMinutes: 60,
    warningMessage: "Please avoid posting promotional/banned content.",
    moderatorIds: [],
    whitelistedKeywords: [],
    keywordWhitelistBypass: true,
};

/**
 * Asynchronously loads all dynamic settings from the database.
 *
 * This function retrieves each configurable value from the `settings` table,
 * using the default value from the `config` object if a setting is not found
 * in the database. This ensures the application starts with a valid configuration.
 */
export const loadSettingsFromDb = async () => {
    // Load all settings from the database, using defaults from the config object if not set
    config.alertLevel = await getSetting('alertLevel', config.alertLevel);
    config.muteLevel = await getSetting('muteLevel', config.muteLevel);
    config.kickLevel = await getSetting('kickLevel', config.kickLevel);
    config.banLevel = await getSetting('banLevel', config.banLevel);
    
    config.spamThreshold = await getSetting('spamThreshold', config.spamThreshold);
    config.muteDurationMinutes = await getSetting('muteDurationMinutes', config.muteDurationMinutes);
    config.warningMessage = await getSetting('warningMessage', config.warningMessage);
    config.moderatorIds = await getSetting('moderatorIds', []);
    config.whitelistedKeywords = await getWhitelistKeywords();
    config.keywordWhitelistBypass = await getSetting('keywordWhitelistBypass', true);
};

/**
 * Updates a specific setting in both the in-memory config object and the database.
 *
 * @param {string} key - The configuration key to update (e.g., 'spamThreshold').
 * @param {*} value - The new value for the setting.
 */
export const updateSetting = async (key, value) => {
    if (key in config) {
        config[key] = value;
        await setSetting(key, value);
    }
};

export default config;