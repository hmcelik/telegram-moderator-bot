# Telegram Moderator Bot

A comprehensive AI-powered Telegram moderation bot with advanced features, complete REST API, and web dashboard integration.

## 🚀 Key Features

- **🧠 AI-Powered Moderation** - Smart spam detection with GPT-4o-mini integration
- **🤬 Advanced Profanity Filter** - Hybrid local + AI profanity detection
- **📱 Complete API Suite** - Full REST API with JWT authentication and Telegram WebApp support
- **👑 Super Admin Controls** - Global statistics, maintenance mode, broadcasting, cache management
- **🎛️ Consistent UI** - Uniform keyboard menus with emoji consistency
- **⚡ Optimized Performance** - Faster responses with parallel processing
- **🔒 Security First** - Rate limiting, CORS protection, comprehensive error handling
- **🧪 Comprehensive Testing** - 152 tests across 15 test suites
- **🐳 Production Ready** - Docker support, monitoring, logging
- **🔄 Role-based Commands** - Smart command registration based on user permissions

## 📋 Quick Start

### Prerequisites

- **Node.js 22+** 
- **npm or yarn**
- **SQLite** (included)
- **ngrok** (for external testing)
- **Telegram Bot Token** ([Get from @BotFather](https://t.me/BotFather))
- **OpenAI API Key** (optional, for AI moderation)

### Installation

```bash
# Clone the repository
git clone https://github.com/hmcelik/telegram-moderator-bot.git
cd telegram-moderator-bot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Configuration

Create a `.env` file with the following variables:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_USER_ID=your_user_id_here

# Optional - AI Features
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
API_PORT=3000
API_BASE_URL=http://localhost:3000
JWT_SECRET=your-super-long-random-secret-string-here

# CORS Configuration
ALLOWED_ORIGIN=http://localhost:8080
```

### Development Setup

1. **Start the Bot** (Terminal 1):
   ```bash
   npm run dev
   ```

2. **Start the API Server** (Terminal 2):
   ```bash
   npm run dev:api
   ```

3. **Start Development Server** (Terminal 3):
   ```bash
   npm run dev:examples
   ```

4. **Expose API for External Testing** (Terminal 4):
   ```bash
   ngrok http 3000
   ```

### Production Deployment

```bash
# Start bot in production
npm start

# Start API server in production
npm run start:api

# Start development server (for examples)
npm run start:dev-server
```

## 🌐 Services Overview

## 🏗️ Project Structure

```
telegram-moderator-bot/
├── src/
│   ├── api/                    # REST API server
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Authentication & validation
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities & error handling
│   ├── bot/                    # Telegram bot
│   │   ├── handlers/           # Message & command handlers
│   │   └── keyboards/          # Inline keyboards
│   └── common/                 # Shared services
│       ├── config/             # Configuration management
│       ├── services/           # Database, logging, Telegram API
│       └── utils/              # Shared utilities
├── __tests__/                  # Test suites
├── examples/                   # Usage examples & demos
├── moderator.db               # SQLite database
├── package.json
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **152 tests** across 15 test suites
- API endpoints testing
- Bot functionality testing
- Database operations testing
- Integration testing

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Configurable origin policies
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Comprehensive request validation
- **Error Sanitization** - Prevents information leakage
- **Helmet Security** - HTTP security headers
- **Maintenance Mode** - Emergency shutdown capability

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker

```bash
# Build image
docker build -t telegram-moderator-bot .

# Run container
docker run -d --name moderator-bot telegram-moderator-bot
```

### Traditional Hosting

1. Clone repository on server
2. Install dependencies: `npm install`
3. Set environment variables
4. Use PM2 for process management:
   ```bash
   pm2 start npm --name "bot" -- start
   pm2 start npm --name "api" -- run start:api
   ```

## 🔧 Configuration

### Bot Settings

Each group can be configured with:
- **Strike thresholds** for warnings, mutes, kicks, and bans
- **AI spam detection** sensitivity
- **Profanity filtering** with custom thresholds
- **Keyword whitelisting** for bypassing filters
- **Moderator permissions** and admin controls

### API Settings

- **CORS origins** for web integration
- **Rate limiting** for API protection
- **JWT tokens** for authentication
- **Swagger documentation** for API exploration

## 📊 Monitoring

- **Winston logging** with file rotation
- **Error tracking** with detailed stack traces
- **Performance metrics** via API endpoints
- **Health checks** for system monitoring
- **Global statistics** for super admins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Commit changes: `git commit -am 'Add feature'`
7. Push to branch: `git push origin feature-name`
8. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: See [BOT_COMMANDS.md](./BOT_COMMANDS.md) and [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/hmcelik/telegram-moderator-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hmcelik/telegram-moderator-bot/discussions)

## 🎯 Roadmap

- [ ] **Web Dashboard** - React-based admin panel
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Analytics** - Detailed reporting
- [ ] **Plugin System** - Extensible architecture
- [ ] **Machine Learning** - Custom model training
- [ ] **Webhook Support** - Real-time notifications

---

**Built with ❤️ for the Telegram community**

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/hmcelik/telegram-moderator-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hmcelik/telegram-moderator-bot/discussions)
- **Complete Setup Guide**: [TELEGRAM_DASHBOARD_SETUP_GUIDE.md](TELEGRAM_DASHBOARD_SETUP_GUIDE.md)

## ⭐ Acknowledgments

- Telegram Bot API team
- Express.js community
- Contributors and testers

---

**Made with ❤️ for the Telegram community**