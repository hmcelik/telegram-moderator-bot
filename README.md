# telegram-moderator-bot

An AI-powered Telegram moderator bot.

---

## Features

* **AI-Powered Content Moderation**: Utilizes OpenAI's GPT-3.5-turbo to classify promotional spam in a Telegram chat. The bot can distinguish between legitimate community discussions and unwanted spam.
* **Dynamic Penalty System**: The bot applies penalties based on the number of strikes a user has accumulated. Penalties can be configured to be an alert, mute, kick, or ban.
* **Whitelist Functionality**: Admins and moderators are whitelisted from spam checks. Additionally, there's a keyword-based whitelist to bypass the AI check for messages containing specific keywords.
* **Configurable Settings via Inline Keyboard**: The bot's behavior is highly configurable through an intuitive inline keyboard interface. These settings are persisted in a database.
* **Audit Logging**: The bot keeps a log of all moderation actions taken.
* **Private Command Interface**: The bot can be configured and managed through private messages with the admin user.

---

## How It Works

The bot listens for messages in a Telegram chat. When a new message is received, it goes through the following steps:

1.  **Whitelist Check**: The bot first checks if the message is from a whitelisted user (admin or moderator). If so, the message is ignored.
2.  **Keyword Bypass**: If the keyword bypass mode is enabled, the bot checks if the message contains any whitelisted keywords. If it does, the message is ignored.
3.  **AI Classification**: If the message is not from a whitelisted user and does not contain any whitelisted keywords, it is sent to the OpenAI API for classification. The API returns a score indicating the likelihood that the message is spam.
4.  **Penalty Application**: If the spam score is above a configured threshold, the message is deleted, and a strike is recorded against the user. The bot then applies a penalty based on the user's total number of strikes.

---

## Setup

1.  **Clone the repository**:
    ```
    git clone [https://github.com/your-username/telegram-moderator-bot.git](https://github.com/your-username/telegram-moderator-bot.git)
    ```
2.  **Install dependencies**:
    ```
    npm install
    ```
3.  **Create a `.env` file** in the root of the project with the following content:
    ```
    TELEGRAM_BOT_TOKEN=your_telegram_bot_token
    OPENAI_API_KEY=your_openai_api_key
    ADMIN_USER_ID=your_telegram_user_id
    DATABASE_PATH=./moderator.db
    ```
4.  **Start the bot**:
    ```
    npm start
    ```
    Or, for development with auto-reloading:
    ```
    npm run dev
    ```

---

## Configuration via Inline Keyboard

To configure the bot, send the `/settings` or `/start` command to the bot in a private chat. This will open the main settings menu with an inline keyboard.

The settings are organized into the following categories:

* **🧠 AI Sensitivity**: Configure the AI's spam detection threshold and keyword bypass mode.
* **⚖️ Penalty Levels**: Set the strike counts for different penalties (alert, mute, kick, ban).
* **⚙️ Miscellaneous**: Configure other settings like mute duration.

Use the buttons to navigate through the menus. For settings that require a numeric input, you will be prompted to send the new value in the chat. The "⬅️ Back" button will take you to the previous menu.

---

## **Unit Tests**

Due to the interactive nature of the bot and the need to mock the Telegram API and a database, writing full end-to-end tests is complex. However, here are some example unit tests for the new `callbackHandler` using Jest. You would need to set up Jest and mock the necessary modules.

**`tests/callbackHandler.test.js`**

```javascript
import { handleCallback } from '../src/handlers/callbackHandler';
import * as telegramService from '../src/services/telegram';
import * as dbService from '../src/services/database';
import config from '../src/config/index.js';

// Mock the services and config
jest.mock('../src/services/telegram');
jest.mock('../src/services/database');
jest.mock('../src/config/index.js', () => ({
    __esModule: true,
    default: {
        spamThreshold: 0.85,
        keywordWhitelistBypass: true,
        alertLevel: 1,
        muteLevel: 2,
        kickLevel: 3,
        banLevel: 0,
        muteDurationMinutes: 60,
    },
    updateSetting: jest.fn(),
}));

describe('Callback Handlers', () => {
    const ADMIN_USER_ID = '12345';
    process.env.ADMIN_USER_ID = ADMIN_USER_ID;
    const CHAT_ID = 'chat-123';
    const MESSAGE_ID = 'msg-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should navigate to the AI sensitivity menu', async () => {
        const callbackQuery = {
            id: 'cb-1',
            from: { id: ADMIN_USER_ID },
            message: { chat: { id: CHAT_ID }, message_id: MESSAGE_ID },
            data: 'settings_ai_sensitivity',
        };

        await handleCallback(callbackQuery);

        expect(telegramService.editMessageText).toHaveBeenCalledWith(
            'Configure AI sensitivity settings:',
            expect.objectContaining({
                chat_id: CHAT_ID,
                message_id: MESSAGE_ID,
            })
        );
    });

    it('should toggle keyword bypass and update the keyboard', async () => {
        const callbackQuery = {
            id: 'cb-2',
            from: { id: ADMIN_USER_ID },
            message: { chat: { id: CHAT_ID }, message_id: MESSAGE_ID },
            data: 'toggle_bypass',
        };
        const newBypassValue = !config.keywordWhitelistBypass;

        await handleCallback(callbackQuery);

        expect(config.updateSetting).toHaveBeenCalledWith('keywordWhitelistBypass', newBypassValue);
        expect(telegramService.answerCallbackQuery).toHaveBeenCalledWith('cb-2', {
            text: `Keyword Bypass is now ${newBypassValue ? 'ON' : 'OFF'}`,
        });
        expect(telegramService.editMessageText).toHaveBeenCalledWith(
            'Configure AI sensitivity settings:',
            expect.anything()
        );
    });
});