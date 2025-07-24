/**
 * @fileoverview This is the main entry point for the Telegram Moderator Bot application.
 * It initializes services, and sets up event listeners for multi-tenant operation.
 */

import bot from '../common/services/telegram.js';
import * as db from '../common/services/database.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleCommand } from './handlers/commandHandler.js';
import { handleCallback } from './handlers/callbackHandler.js';
import logger from '../common/services/logger.js';

/**
 * Registers Telegram slash commands with appropriate scopes.
 */
const registerBotCommands = async () => {
    try {
        const publicCommands = [
            { command: 'help', description: 'Show help information' },
            { command: 'mystrikes', description: 'Check your own strike count' },
            { command: 'settings', description: 'Open settings menu privately' }
        ];

        const adminOnlyCommands = [
            { command: 'register', description: 'Register the bot in this group' },
            { command: 'status', description: 'Show the bot\'s configuration' },
            { command: 'checkstrikes', description: 'View a user\'s strike history' },
            { command: 'addstrike', description: 'Add strikes to a user' },
            { command: 'removestrike', description: 'Remove strikes from a user' },
            { command: 'setstrike', description: 'Set a user\'s strike count' },
            { command: 'auditlog', description: 'View recent moderation actions' }
        ];

        // Set public commands (for everyone)
        await bot.setMyCommands(publicCommands, {
            scope: { type: 'default' }
        });

        // Set admin + public commands (for group admins)
        await bot.setMyCommands([...publicCommands, ...adminOnlyCommands], {
            scope: { type: 'all_chat_administrators' }
        });

        logger.info('✅ Bot commands registered successfully.');
    } catch (err) {
        logger.error('❌ Failed to register bot commands:', err);
    }
};

/**
 * The main asynchronous function that starts the bot.
 */
const main = async () => {
    logger.info('Starting bot...');

    // 1. Initialize the database connection and ensure tables are created.
    await db.initializeDatabase();
    logger.info('Database initialized.');

    // 2. Get the bot's identity
    const botUser = await bot.getMe();

    // 3. Register slash commands
    await registerBotCommands();

    // 4. Group join/leave events
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

    // 5. Handle messages
    bot.on('message', (msg) => {
        if (!msg.text) return;
        if (msg.text.startsWith('/')) {
            handleCommand(msg);
        } else {
            handleMessage(msg);
        }
    });

    // 6. Handle inline keyboard callbacks
    bot.on('callback_query', handleCallback);

    // 7. Handle polling errors
    bot.on('polling_error', (error) => {
        logger.error(`Polling error: ${error.code} - ${error.message}`);
    });

    logger.info(`🚀 Bot "${botUser.first_name}" is running! Watching for messages...`);
    logger.info(`Super Admin User ID: ${process.env.ADMIN_USER_ID}`);
};

// Execute the main function and handle fatal startup errors
main().catch(err => {
    logger.error('Failed to start bot:', err);
    process.exit(1);
});
