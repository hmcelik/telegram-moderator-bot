# AI Telegram Moderator Bot

An advanced, multi-tenant Telegram moderation bot built with Node.js. This bot uses AI to detect and act upon spam or promotional content, while providing administrators with a powerful and flexible suite of tools to manage user strikes fairly and transparently.

## ✨ Features

- **🤖 AI-Powered Content Analysis**: Uses Natural Language Processing (NLP) to score messages and automatically detect spam, advertisements, and other unwanted content.
- **⚖️ Advanced Strike System**:
  - **Automatic Strikes**: Users automatically receive strikes for posting content that violates the configured rules.
  - **Manual Strike Management**: Admins can add, remove, or set a user's strike count with specific commands, including a reason for the action.
  - **Strike Expiration**: Strikes can be configured to automatically expire after a set number of days, giving users a chance to clear their record.
  - **Good Behavior Forgiveness**: Rewards positive participation by automatically removing a strike after a configurable period of good behavior.
- **🔐 Privacy-Focused**: Commands like `/checkstrikes` and `/mystrikes` send sensitive information via private message to avoid public shaming.
- **📋 Transparent Auditing**:
  - **Audit Log**: Admins can view a detailed log of all moderation actions (both automatic and manual) in the group.
  - **Detailed Strike History**: Admins and users can see a detailed history of each strike, including the reason and date.
- **⚙️ Per-Group Configuration**: Every setting—from penalty levels to AI sensitivity—can be configured independently for each group via an intuitive private message menu.
- **🚀 Robust & User-Friendly**:
  - **Persistent User Data**: User information is stored in a database, ensuring that admin commands work reliably even after a bot restart.
  - **Clean Chat Interface**: The bot automatically cleans up command messages and temporary error notifications to keep the group chat tidy.
  - **Smart Help Command**: The `/help` command shows a context-aware list of commands, displaying admin-only commands just to administrators.

---

## 🛠️ Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/hmcelik/telegram-moderator-bot.git
    cd telegram-moderator-bot
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables:

    ```env
    # Your Telegram Bot Token from BotFather
    TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN

    # Your OpenAI API Key for content analysis
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY

    # (Optional) The numeric Telegram User ID of the bot's super admin
    ADMIN_USER_ID=YOUR_TELEGRAM_USER_ID

    # (Optional) The path to the SQLite database file
    DATABASE_PATH=./moderator.db
    ```

4.  **Run the bot:**
    ```bash
    npm start
    ```

---

## 🤖 Usage Guide

### Public Commands (For all users)

-   `/help`
    Shows a list of available commands. Sent privately.

-   `/mystrikes`
    Checks your own strike count and history in the current group. The report is sent privately.

### Administrator Commands

> **Note**: These commands must be used within the group chat.

-   `/register`
    Initializes the bot in a new group. This must be the first command run when adding the bot to a group.

-   `/status`
    Displays a permanent message in the chat showing the bot's current configuration for that group.

-   `/checkstrikes <@username>`
    Privately sends you a detailed strike report for the specified user, including their history.

-   `/addstrike <@username> <amount> [reason...]`
    Adds a specified number of strikes to a user and logs the action with the provided reason.
    -   *Example*: `/addstrike @testuser 2 Repeatedly off-topic`

-   `/removestrike <@username> [amount] [reason...]`
    Removes a specified number of strikes from a user. If `[amount]` is omitted, it defaults to `1`.
    -   *Example*: `/removestrike @testuser 1 Appealed successfully`

-   `/setstrike <@username> <amount> [reason...]`
    Sets a user's strike count to an exact number. Useful for resetting a user to zero.
    -   *Example*: `/setstrike @testuser 0 Fresh start`

-   `/auditlog`
    Privately sends you a detailed report of the last 15 moderation actions in the group, including both automatic and manual strikes.

### Configuration Menu

To configure penalty levels, strike expiration, and other advanced settings, send a private message to the bot with the command:
- `/settings`

This will open an interactive menu where you can manage the settings for any group in which you are an administrator.

---

## ✅ Running Tests

The project includes a comprehensive test suite using **Vitest**. To run the tests, use the following command:

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