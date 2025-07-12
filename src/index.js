import bot from './services/telegram.js';
import { initDb } from './services/database.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleCommand } from './handlers/commandHandler.js';
import { handleCallback } from './handlers/callbackHandler.js';
import config, { loadSettingsFromDb } from './config/index.js';
import logger from './services/logger.js';

const main = async () => {
    logger.info('Starting bot...');

    // 1. Initialize and connect to the database
    await initDb();

    // 2. Load persistent settings from the database into the config
    await loadSettingsFromDb();
    logger.info('Configuration loaded from database.');

    // 3. Register message listener for all messages
    bot.on('message', (msg) => {
        // Pass to command handler if it's a command, otherwise to the general message handler
        if (msg.text && msg.text.startsWith('/')) {
            handleCommand(msg);
        } else {
            handleMessage(msg);
        }
    });

    // 4. Register callback query listener for inline keyboard interactions
    bot.on('callback_query', handleCallback);

    bot.on('polling_error', (error) => {
        logger.error(`Polling error: ${error.code} - ${error.message}`);
    });

    logger.info(`🚀 Bot is running! Watching for messages...`);
    logger.info(`Admin User ID: ${process.env.ADMIN_USER_ID}`);
    logger.info(`Initial Penalty Mode: ${config.penaltyMode}`);
    logger.info(`Initial Moderator IDs: ${config.moderatorIds.join(', ')}`);
};

main().catch(err => {
    logger.error('Failed to start bot:', err);
    process.exit(1);
});