/**
 * @fileoverview This is the main entry point for the Telegram Moderator Bot application.
 * It initializes services, and sets up event listeners for multi-tenant operation.
 */

import bot from './services/telegram.js';
import * as db from './services/database.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleCommand } from './handlers/commandHandler.js';
import { handleCallback } from './handlers/callbackHandler.js';
import logger from './services/logger.js';

/**
 * The main asynchronous function that starts the bot.
 */
const main = async () => {
    logger.info('Starting bot...');

    // 1. Initialize the database connection and ensure tables are created.
    await db.initDb();
    logger.info('Database initialized.');

    // Get the bot's own user object to identify when it's added/removed from groups.
    const botUser = await bot.getMe();

    // 2. Register listeners for group membership changes.
    bot.on('new_chat_members', (msg) => {
        if (msg.new_chat_members.some(member => member.id === botUser.id)) {
            logger.info(`Bot added to new group: "${msg.chat.title}" (${msg.chat.id})`);
            db.addGroup(msg.chat.id.toString(), msg.chat.title);
        }
    });

    bot.on('left_chat_member', (msg) => {
        if (msg.left_chat_member.id === botUser.id) {
            logger.info(`Bot removed from group: "${msg.chat.title}" (${msg.chat.id})`);
            db.removeGroup(msg.chat.id.toString());
        }
    });

    // 3. Register a listener for all incoming text messages and commands.
    bot.on('message', (msg) => {
        // We only process messages with text.
        // The membership changes are handled by dedicated events now.
        if (!msg.text) return;

        if (msg.text.startsWith('/')) {
            handleCommand(msg);
        } else {
            handleMessage(msg);
        }
    });

    // 4. Register a listener for callback queries from inline keyboards.
    bot.on('callback_query', handleCallback);

    // 5. Set up a listener for polling errors to prevent the bot from crashing silently.
    bot.on('polling_error', (error) => {
        logger.error(`Polling error: ${error.code} - ${error.message}`);
    });

    logger.info(`🚀 Bot "${botUser.first_name}" is running! Watching for messages...`);
    logger.info(`Super Admin User ID: ${process.env.ADMIN_USER_ID}`);
};

// Execute the main function and handle any fatal startup errors.
main().catch(err => {
    logger.error('Failed to start bot:', err);
    process.exit(1); // Exit the process with an error code.
});