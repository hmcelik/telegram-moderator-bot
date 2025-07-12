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
    // Runtime-configurable settings
    spamThreshold: 0.85,
    penaltyMode: PenaltyMode.KICK,
    penaltyLevel: 3,
    muteDurationMinutes: 60,
    warningMessage: "Please avoid posting promotional content.",
    moderatorIds: [], // Manual whitelist for non-admins
    whitelistedKeywords: [],
    keywordWhitelistBypass: true, // If true, AI check is skipped when a keyword is found
};

// Function to load all settings from the database on startup
export const loadSettingsFromDb = async () => {
    config.spamThreshold = await getSetting('spamThreshold', config.spamThreshold);
    config.penaltyMode = await getSetting('penaltyMode', config.penaltyMode);
    config.penaltyLevel = await getSetting('penaltyLevel', config.penaltyLevel);
    config.muteDurationMinutes = await getSetting('muteDurationMinutes', config.muteDurationMinutes);
    config.warningMessage = await getSetting('warningMessage', config.warningMessage);
    config.moderatorIds = await getSetting('moderatorIds', []);
    config.whitelistedKeywords = await getWhitelistKeywords();
    config.keywordWhitelistBypass = await getSetting('keywordWhitelistBypass', true);
};

// Function to update a setting and persist it
export const updateSetting = async (key, value) => {
    config[key] = value;
    await setSetting(key, value);
};

export default config;