# Telegram Moderator Bot (Multi-Tenant Edition)

An AI-powered Telegram bot designed to automate chat moderation by intelligently detecting and penalizing promotional spam. This version is refactored to be **multi-tenant**, allowing any user to add the bot to their group and manage it independently.

-----

## ✨ Features

  * **🤖 AI-Powered Content Moderation**: Leverages OpenAI's GPT-3.5-turbo API to analyze message content and accurately distinguish between legitimate community hype and unsolicited promotional spam.
  * **🏢 Multi-Tenant Architecture**: The bot can be added to any number of Telegram groups and configured independently for each one. All settings, strikes, and whitelists are isolated per chat.
  * **🔐 Decentralized Administration**: Any administrator of a Telegram group can manage the bot's settings for that specific group directly from a private chat with the bot.
  * **⚙️ Interactive Settings UI**: A clean and intuitive inline keyboard interface allows admins to select which group they want to manage, ensuring the right settings are always modified.
  * **⚖️ Dynamic & Group-Specific Penalties**: Automatically applies escalating penalties (Alert, Mute, Kick, Ban) based on a user's strike count within a specific group. All penalty levels and mute durations are configurable per group.
  * **🚫 Per-Group Whitelisting**:
      * **Admin & Moderator Immunity**: Group administrators and manually whitelisted moderators are exempt from all spam checks within their group.
      * **Keyword Bypass**: Each group can have its own configurable list of keywords that will bypass the AI check.
  * **💾 Persistent Configuration**: All group-specific settings are saved to a local SQLite database, ensuring your configuration is preserved when the bot restarts.
  * **📊 Group-Specific Status**: The `/status` command shows a real-time summary of the bot's configuration and daily stats for the group it's used in.
  * **🧪 Automated Testing**: The project includes a suite of automated tests built with **Vitest** to ensure code quality and reliability.

-----

## 🚀 How It Works

The bot's logic is designed to be both effective and fair on a per-group basis:

1.  **Add & Register**: An administrator adds the bot to their group. If the bot is new, it registers automatically. If it was already a member, an admin must use the `/register` command in the group chat.
2.  **Admin Configuration**: An admin sends the `/settings` command to the bot in a private message. The bot presents a menu to choose which group to manage.
3.  **Custom Settings**: The admin uses the inline keyboard to configure the settings—such as spam threshold, penalty levels, and whitelists—specifically for the selected group.
4.  **Message Handling**: When a message is posted in a group, the bot loads the custom configuration for that specific chat.
5.  **AI Analysis & Action**: If a message from a non-whitelisted user is flagged as spam by the AI, the bot deletes it, records a strike against the user for that group, and applies the appropriate, pre-configured penalty.

-----

## 🛠️ Setup and Installation

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
4.  **Create Environment File**: Create a file named `.env` in the root of the project. This file is ignored by Git. Add the following keys:
    ```env
    # Get this from @BotFather on Telegram
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

    # Your API key from platform.openai.com
    OPENAI_API_KEY=your_openai_api_key_here

    # Your personal Telegram User ID. This ID is for the "Super Admin" role (e.g., for broadcasting messages). It is NOT for managing group settings.
    ADMIN_USER_ID=your_telegram_user_id_here

    # (Optional) The path where the database file will be stored. Defaults to ./moderator.db
    DATABASE_PATH=./moderator.db
    ```
5.  **Start the Bot**:
      * For production: `npm start`
      * For development (with automatic restarts on file changes): `npm run dev`

-----

## 👨‍💻 Usage and Configuration

### Adding the Bot to a Group

1.  Add the bot to your Telegram group.
2.  Promote the bot to an **Administrator**. This is required so it can read the admin list and delete messages.
3.  If the bot was already in the group before its last restart, type `/register` in the group chat. An admin must do this.

### Configuring a Group

1.  As a group admin, send a private message to the bot with the command `/settings` or `/start`.
2.  If you are an admin in multiple groups where the bot is present, it will ask you to choose which group you want to manage.
3.  Use the inline keyboard menus to configure the settings for your selected group. The bot will prompt you for new values when needed.

### Menu Structure

  * **🧠 AI Sensitivity**: Adjust the AI's strictness and toggle the keyword bypass feature.
  * **⚖️ Penalty Levels**: Set the strike counts that trigger alerts, mutes, kicks, or bans.
  * **🚫 Whitelist Management**: Manage whitelisted keywords and moderator user IDs.
  * **⚙️ Miscellaneous**: Configure the mute duration and the custom warning message for users.

-----

## ✅ Running Tests

The project is equipped with an automated test suite using **Vitest**. To run the tests and ensure everything is working as expected, use the following command:

```bash
npm test
```

-----

## 📂 Project Structure

The project is structured to separate concerns, making it easy to maintain and extend.

  * `src/`
      * `config/`: Manages default settings and loading group-specific configurations.
      * `handlers/`: Contains the core logic for message, command, and callback processing.
      * `keyboards/`: Defines the layout for all inline keyboard menus.
      * `services/`: Provides abstractions for external services like the Telegram API, OpenAI (NLP), database, and logger.
      * `utils/`: Contains shared utilities and enumerations like `PenaltyMode`.
      * `index.js`: The main entry point of the application.
  * `__tests__/`: Contains all automated tests for the application.
  * `.env`: Stores secret keys and configuration variables.
  * `package.json`: Defines project metadata, scripts, and dependencies.

-----

## 📦 Dependencies

  * **axios**: For making HTTP requests to the OpenAI API.
  * **dotenv**: To load environment variables from the `.env` file.
  * **node-telegram-bot-api**: The core library for interacting with the Telegram Bot API.
  * **sqlite** & **sqlite3**: A promise-based wrapper and the driver for the SQLite database.
  * **winston**: A versatile logging library.
  * **vitest**: A modern and fast test runner for unit and integration testing.

-----

## 📜 License

This project is licensed under the MIT License.