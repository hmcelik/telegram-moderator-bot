# Telegram Moderator Bot

An AI-powered Telegram bot designed to automate chat moderation by intelligently detecting and penalizing promotional spam.

 ---

## Features

  * **🤖 AI-Powered Content Moderation**: Leverages OpenAI's GPT-3.5-turbo API to analyze message content and accurately distinguish between legitimate community hype and unsolicited promotional spam.
  * **⚙️ Interactive Inline Keyboard UI**: All bot settings are managed through a clean and intuitive inline button interface, eliminating the need for text commands.
  * **⚖️ Dynamic Penalty System**: Automatically applies escalating penalties based on a user's strike count. Actions are fully configurable and can include a temporary mute, a kick (can rejoin), or a permanent ban.
  * **🚫 Comprehensive Whitelisting**:
      * **Admin & Moderator Immunity**: Group administrators and manually added moderators are completely exempt from all spam checks.
      * **Keyword Bypass**: A configurable list of keywords that, if present in a message, will cause the bot to ignore it, preventing false positives on approved topics.
  * **💾 Persistent Configuration**: All settings are saved to a local SQLite database, ensuring your configuration is preserved even when the bot restarts.
  * **📊 Status Overview**: A simple `/status` command provides a real-time summary of the bot's current configuration and daily statistics, such as the number of messages deleted.

-----

## How It Works

The bot's logic is designed to be both effective and fair:

1.  **Initial Check**: When a message is posted in a group, the bot first checks if the author is a group admin or a whitelisted moderator. If so, the message is ignored.
2.  **Keyword Bypass**: If the author is not exempt, the bot checks if the "Keyword Bypass" mode is active and if the message contains any of the whitelisted keywords. If it does, the message is ignored.
3.  **AI Analysis**: If the message is not exempt by the checks above, it is sent to the OpenAI API for analysis. The API returns a spam score from 0.0 to 1.0.
4.  **Action & Penalty**: If the returned score is higher than the configured "Spam Threshold," the bot immediately deletes the message. It then records a strike against the user and applies the most severe penalty that the user's new strike count qualifies for. For example, if the Mute Level is 2 and the Kick Level is 4, a user reaching their 4th strike will be kicked, not just muted.

-----

## Setup

Setting up the bot requires a few simple steps:

1.  **Prerequisites**: Make sure you have **Node.js (v21.6.1 or later)** installed.
2.  **Clone the Repository**:
    ```bash
    git clone https://github.com/hmcelik/telegram-moderator-bot.git
    cd telegram-moderator-bot
    ```
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Create Environment File**: Create a file named `.env` in the root of the project and add the following keys. This file is included in the `.gitignore` and will not be tracked by Git.
    ```env
    # Get this from @BotFather on Telegram
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

    # Your API key from platform.openai.com
    OPENAI_API_KEY=your_openai_api_key_here

    # Your personal Telegram User ID. The bot will only respond to this ID for settings.
    ADMIN_USER_ID=your_telegram_user_id_here

    # (Optional) The path where the database file will be stored.
    DATABASE_PATH=./moderator.db
    ```
5.  **Start the Bot**:
      * For production: `npm start`
      * For development (with automatic restarts on file changes): `npm run dev`

-----

## Configuration via Inline Keyboard

All bot configuration is handled through a private message with the bot from the admin's account.

1.  **Open the Menu**: Send the `/settings` or `/start` command to the bot. The main settings panel will appear with buttons.
2.  **Navigate**: Use the buttons to navigate through the different settings categories. The menu message will update in place.
3.  **Update Values**:
      * When you click a button to change a value (e.g., "Set Threshold"), the menu will turn into a prompt asking you for the new value.
      * Send the new value (e.g., `0.9` or `0.3`) as a text message.
      * The bot will confirm the change and then post a fresh, updated menu at the bottom of the chat, ready for your next action.

### Menu Structure:

  * **🧠 AI Sensitivity**:
      * **Set Threshold**: Adjusts the AI's strictness (0.1 to 1.0). Higher is stricter.
      * **Toggle Bypass**: Turns the keyword-based bypass on or off.
  * **⚖️ Penalty Levels**:
      * Set the strike number at which each penalty is triggered. A value of `0` disables the penalty.
      * **Alert Level**: Warns the user in chat.
      * **Mute Level**: Mutes the user.
      * **Kick Level**: Kicks the user (can rejoin).
      * **Ban Level**: Permanently bans the user.
  * **🚫 Whitelist Management**:
      * **Manage Keywords**: Add, remove, or list keywords that bypass the AI check.
      * **Manage Moderators**: Add, remove, or list user IDs of moderators who are immune to spam checks.
  * **⚙️ Miscellaneous**:
      * **Set Mute Duration**: The length of time, in minutes, a user is muted for.

-----

## Codebase Overview

The project is structured to separate concerns, making it easy to maintain and extend.

  * `src/`
      * `config/`: Manages loading and updating bot settings.
      * `handlers/`: Contains the core logic for message processing.
          * `commandHandler.js`: Handles incoming text commands (`/settings`, `/status`).
          * `callbackHandler.js`: Handles all inline keyboard button presses and the interactive settings workflow.
          * `messageHandler.js`: Handles regular chat messages, routing them to the AI for analysis and applying penalties.
      * `keyboards/`: Defines the layout and callback data for all inline keyboard menus.
      * `services/`: Provides abstractions for external services.
          * `database.js`: Manages all interactions with the SQLite database.
          * `logger.js`: Configures the Winston logging service for console and file output.
          * `nlp.js`: Interfaces with the OpenAI API for spam classification.
          * `telegram.js`: A wrapper around the `node-telegram-bot-api` library, providing helper functions.
      * `utils/`: Contains shared utilities and enumerations.
      * `index.js`: The main entry point of the application.
  * `.env`: Stores secret keys and configuration variables.
  * `package.json`: Defines project metadata and dependencies.

-----

## Dependencies

  * [axios](https://axios-http.com/): For making HTTP requests to the OpenAI API.
  * [dotenv](https://www.google.com/search?q=https://github.com/motdotla/dotenv%23readme): To load environment variables from the `.env` file.
  * [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api): The core library for interacting with the Telegram Bot API.
  * [sqlite](https://www.google.com/search?q=https://github.com/WiseLibs/sqlite): A promise-based wrapper for the SQLite3 driver.
  * [sqlite3](https://www.google.com/search?q=https://github.com/WiseLibs/node-sqlite3): The driver for the SQLite database.
  * [winston](https://github.com/winstonjs/winston): A versatile logging library for Node.js.

-----

## License

This project is licensed under the MIT License.