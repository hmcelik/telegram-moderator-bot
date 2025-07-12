import { PenaltyMode } from '../utils/enums.js';
import dotenv from 'dotenv';
import { getSetting, setSetting, getWhitelistKeywords } from '../services/database.js';

dotenv.config();

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
    // --- New Dynamic Penalty Level Settings ---
    // Each action has its own strike level. 0 means the action is disabled.
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

export const loadSettingsFromDb = async () => {
    // Load all settings from the database, using defaults from above if not set
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

export const updateSetting = async (key, value) => {
    config[key] = value;
    await setSetting(key, value);
};

export default config;