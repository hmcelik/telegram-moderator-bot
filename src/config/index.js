import { PenaltyMode } from '../utils/enums.js';
import dotenv from 'dotenv';
import { getSetting, setSetting } from '../services/database.js';

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
    // --- Runtime-configurable settings with defaults ---
    spamThreshold: 0.85,
    penaltyMode: PenaltyMode.KICK,
    
    // New Multi-Stage Penalty System Settings
    penaltyLevel: 3, // Number of strikes before kick/ban
    muteDurationMinutes: 60, // Mute duration for 2nd strike
    warningMessage: "Please avoid posting promotional content. Further violations will result in a mute or ban."
};

// Function to load settings from DB on startup
export const loadSettingsFromDb = async () => {
    config.spamThreshold = await getSetting('spamThreshold', config.spamThreshold);
    config.penaltyMode = await getSetting('penaltyMode', config.penaltyMode);
    config.penaltyLevel = await getSetting('penaltyLevel', config.penaltyLevel);
    config.muteDurationMinutes = await getSetting('muteDurationMinutes', config.muteDurationMinutes);
    config.warningMessage = await getSetting('warningMessage', config.warningMessage);
    config.moderatorIds = await getSetting('moderatorIds', config.moderatorIds || []);
};

// Function to update a setting and persist it
export const updateSetting = async (key, value) => {
    config[key] = value;
    await setSetting(key, value);
};

export default config;