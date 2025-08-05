# Telegram Moderator Bot

A comprehensive AI-powered Telegram moderation bot with advanced features and complete API integration.

## 🚀 Key Features

- **🧠 AI-Powered Moderation** - Smart spam detection with GPT-4o-mini integration
- **🤬 Advanced Profanity Filter** - Separate profanity detection with local + AI hybrid approach
- **📱 Complete API Suite** - Full REST API with NLP testing endpoints
- **👑 Super Admin Controls** - Global statistics, maintenance mode, broadcasting, cache management
- **🎛️ Consistent UI** - Uniform keyboard menus with emoji consistency
- **⚡ Optimized Performance** - Faster responses with parallel processing
- **🔒 Security First** - Rate limiting, CORS protection, JWT authentication
- **🧪 Comprehensive Testing** - 152 tests across 15 test suites
- **🐳 Production Ready** - Docker support, monitoring, logging
- **🔄 Role-based Commands** - Smart command registration based on user permissions

## 📋 Quick Start

### Prerequisites

- Node.js 22+ 
- npm or yarn
- SQLite (included)
- ngrok (for external testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/hmcelik/telegram-moderator-bot.git
cd telegram-moderator-bot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Telegram bot token and other settings
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

### Running Services

| Service | URL | Purpose |
|---------|-----|---------|
| **Bot** | N/A | Telegram bot polling |
| **API Server** | `http://localhost:3000` | Main API endpoints |
| **Dev Server** | `http://localhost:8080` | Serves HTML examples |
| **Ngrok Tunnel** | `https://abc123.ngrok.io` | Public API access |
| **Swagger Docs** | `http://localhost:3000/api/docs` | API documentation |
| **Ngrok Dashboard** | `http://127.0.0.1:4040` | Tunnel status |

## 🌐 API Endpoints

### Health & Status
- `GET /api/v1/webapp/health` - API health check

### Authentication

The API supports **two authentication methods** for different use cases:

#### 1. **Telegram Login Widget** (External Websites)
For integrating with external websites and applications:

- `POST /api/v1/auth/verify` - Universal authentication endpoint (supports both methods)
- `POST /api/v1/auth/login-widget` - Dedicated Login Widget endpoint (returns JWT token)

**Usage Example:**
```javascript
// Login Widget authentication data
const loginData = {
    id: 123456789,
    first_name: "John",
    last_name: "Doe", 
    username: "johndoe",
    photo_url: "https://...",
    auth_date: 1672531200,
    hash: "telegram_provided_hash"
};

const response = await fetch('/api/v1/auth/login-widget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
});
```

#### 2. **Telegram Mini App** (WebApp initData)
For Telegram Mini Apps and WebApps:

- `POST /api/v1/webapp/auth` - WebApp authentication (returns JWT token)

**Usage Example:**
```javascript
// Mini App initData authentication
const initData = window.Telegram.WebApp.initData;

const response = await fetch('/api/v1/webapp/auth', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData 
    }
});
```

#### Authentication Flow
1. **Login Widget**: User clicks widget → Telegram validates → Your site receives user data → Send to API → Get JWT token
2. **Mini App**: Mini App loads → Get initData → Send to API → Get JWT token

#### Using JWT Tokens
Once authenticated, include the JWT token in subsequent API requests:
```javascript
const response = await fetch('/api/v1/groups', {
    headers: {
        'Authorization': `Bearer ${jwtToken}`
    }
});
```

#### Examples & Integration
- **HTML/JS Example**: `examples/login-widget-example.html`
- **JS Client Library**: `examples/telegram-auth-client.js`
- **React Integration**: `examples/react-telegram-auth.jsx`

### User Management
- `GET /api/v1/webapp/user/profile` - Get user profile
- `GET /api/v1/webapp/user/groups` - Get user's groups

### Group Management
- `GET /api/v1/groups` - List user's groups
- `GET /api/v1/groups/:groupId/settings` - Get group settings
- `PUT /api/v1/groups/:groupId/settings` - Update group settings
- `GET /api/v1/groups/:groupId/stats` - Get group statistics

### WebApp Specific
- `GET /api/v1/webapp/group/:groupId/settings` - Get group settings (WebApp)
- `PUT /api/v1/webapp/group/:groupId/settings` - Update group settings (WebApp)
- `GET /api/v1/webapp/group/:groupId/stats` - Get group statistics (WebApp)

### NLP Testing (NEW! 🔥)
- `GET /api/v1/nlp/status` - Get NLP service status
- `POST /api/v1/nlp/test/spam` - Test spam detection
- `POST /api/v1/nlp/test/profanity` - Test profanity detection
- `POST /api/v1/nlp/analyze` - Complete message analysis

## 🤖 Bot Commands

### Public Commands (Available to all users)
- `/help` - Show command list and bot information
- `/mystrikes` - Check your strike count privately

### Administrator Commands (Group admins only)
- `/register` - Register the bot in a new group
- `/status` - Display current bot settings for the group
- `/checkstrikes @user` - View a user's strike history
- `/addstrike @user <amount> [reason]` - Add strikes to a user
- `/removestrike @user [amount] [reason]` - Remove strikes from a user (defaults to 1)
- `/setstrike @user <amount> [reason]` - Set user's strike count to specific number
- `/auditlog` - View recent moderation actions (sent as file)

### Super Administrator Commands (Bot owner only)
- `/globalstats` - View global bot statistics across all groups
- `/maintenance <on|off>` - Toggle maintenance mode
- `/broadcast <message>` - Send message to all registered groups
- `/forceupdate` - Force refresh bot configurations
- `/clearcache` - Clear all cached data

> **Note:** Super admin commands work in both private chats and groups. Commands are automatically registered based on user permissions.

## 🔐 Authentication

### Telegram Mini Apps

```javascript
// In your Telegram Mini App
const initData = window.Telegram.WebApp.initData;

const response = await fetch('/api/v1/webapp/auth', {
    method: 'POST',
    headers: {
        'X-Telegram-Init-Data': initData,
        'Content-Type': 'application/json'
    }
});

const { token } = await response.json();
```

### External Websites

```javascript
// For external websites (testing only)
const mockInitData = "user=%7B%22id%22%3A123..."; // Mock data

const response = await fetch('https://your-ngrok-url.ngrok.io/api/v1/webapp/auth', {
    method: 'POST',
    headers: {
        'X-Telegram-Init-Data': mockInitData,
        'Content-Type': 'application/json'
    }
});
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test __tests__/api/webapp.test.js

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- ✅ **152 Tests Passing** - Comprehensive test suite
- ✅ **API Endpoints** - All REST API endpoints tested
- ✅ **Bot Commands** - User, admin, and super admin commands
- ✅ **NLP Processing** - Spam and profanity detection
- ✅ **Authentication** - Telegram WebApp validation
- ✅ **Database Operations** - Full CRUD testing
- ✅ **Security Features** - CORS, rate limiting, validation
- ✅ **Error Handling** - Proper error responses
- ✅ **Integration Tests** - End-to-end workflows

### Example Applications

| Example | URL | Purpose |
|---------|-----|---------|
| **Local External Website** | `http://localhost:8080/external` | Local testing |
| **Telegram Mini App** | `http://localhost:8080/miniapp` | Mini app demo |
| **Production External** | `examples/production-external-website.html` | Deploy anywhere |

## 🔧 Configuration

### Environment Variables

```bash
# .env file
BOT_TOKEN=your_telegram_bot_token
DATABASE_PATH=./moderator.db
API_PORT=3000
DEV_SERVER_PORT=8080
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_SECRET=your_bot_secret
OPENAI_API_KEY=your_openai_api_key
ADMIN_USER_ID=your_telegram_user_id    # Required for super admin commands
LOG_LEVEL=info
MAINTENANCE_MODE=false                   # Can be toggled via /maintenance command
```

### Super Admin Setup

To enable super admin functionality:

1. **Get your Telegram User ID**:
   - Message [@userinfobot](https://t.me/userinfobot) on Telegram
   - Copy your user ID

2. **Set environment variable**:
   ```bash
   ADMIN_USER_ID=your_telegram_user_id
   ```

3. **Restart the bot** to register super admin commands

4. **Available super admin commands**:
   - Work in both private chats and groups
   - Automatically registered for the configured user
   - Provide global bot management capabilities

### CORS Configuration

The API automatically allows:
- `web.telegram.org` (Telegram WebApp)
- `localhost` and `127.0.0.1` (Development)
- `*.ngrok.io` and `*.ngrok.app` (Testing)
- Custom domains (add to configuration)

### Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Health check**: Higher limits for monitoring

## 🚀 Deployment

### Local Development

1. **Start all services**:
   ```bash
   # Terminal 1: Bot with auto-reload
   npm run dev
   
   # Terminal 2: API Server with auto-reload
   npm run dev:api
   
   # Terminal 3: Development HTML server
   npm run dev:examples
   ```

2. **Access services**:
   - Bot: Running in background (check console logs)
   - API: `http://localhost:3000`
   - Examples: `http://localhost:8080`
   - Swagger: `http://localhost:3000/api/docs`

3. **Test locally**:
   - Use `http://localhost:8080/external` for testing
   - Perfect for development and debugging

### External Testing with Ngrok

1. **Start services**:
   ```bash
   # Terminal 1: API Server
   npm start:api
   
   # Terminal 2: Ngrok
   ngrok http 3000
   ```

2. **Deploy test website**:
   - Upload `examples/production-external-website.html` to any hosting
   - Configure with your ngrok HTTPS URL
   - Test external integration

3. **Supported hosts**:
   - GitHub Pages
   - Netlify
   - Vercel
   - Any web hosting service

### Production Deployment

#### API Server Options

**Cloud Platforms**:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repository
- **DigitalOcean**: App Platform deployment
- **AWS**: EC2 or Elastic Beanstalk

**VPS Deployment**:
```bash
# On your server
git clone https://github.com/hmcelik/telegram-moderator-bot.git
cd telegram-moderator-bot
npm install --production

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start services
npm start        # Start bot
npm run start:api # Start API server (separate terminal)
```

**Docker Deployment**:
```bash
# Build and run
docker build -t telegram-moderator-bot .
docker run -p 3000:3000 telegram-moderator-bot
```

#### Domain & SSL

1. **Point domain** to your server
2. **Setup SSL** with Let's Encrypt:
   ```bash
   certbot --nginx -d yourdomain.com
   ```
3. **Update CORS** configuration with your domain

## 🔒 Security Features

### Built-in Security

- ✅ **Helmet.js** - Security headers
- ✅ **CORS Protection** - Controlled cross-origin access
- ✅ **Rate Limiting** - Request throttling
- ✅ **Input Validation** - Request sanitization
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **HMAC Verification** - Telegram data validation

### Production Security Checklist

- [ ] **HTTPS enabled** (SSL certificate)
- [ ] **Environment variables** secured
- [ ] **Database encryption** (if sensitive data)
- [ ] **Server monitoring** setup
- [ ] **Backup strategy** implemented
- [ ] **Access logs** configured
- [ ] **Firewall rules** configured

## 📊 Monitoring

### Health Checks

```bash
# Check API health
curl https://your-api-domain.com/api/v1/webapp/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-07-30T12:00:00.000Z",
  "features": {
    "webAppSupport": true,
    "cors": true,
    "rateLimit": true,
    "authentication": true,
    "swagger": true
  }
}
```

### Logging

- **Console logs** in development
- **File logs** in production (`combined.log`, `error.log`)
- **Structured JSON** logging
- **Request/response** tracking

## 🛠 Development

### Project Structure

```
src/
├── api/                    # API server components
│   ├── server.js          # Main API server
│   ├── controllers/       # Business logic
│   ├── middleware/        # Authentication, validation
│   ├── routes/           # API route definitions
│   └── services/         # Utility services
├── bot/                   # Telegram bot
│   ├── index.js          # Bot entry point
│   ├── handlers/         # Message, command, callback handlers
│   └── keyboards/        # Inline keyboards
├── common/               # Shared utilities
│   ├── config/          # Configuration management
│   ├── services/        # Database, logging, NLP
│   └── utils/           # Enums, helpers
└── dev-server.js        # Development HTML server

examples/                 # Integration examples
├── external-website.html     # Local testing
├── production-external-website.html  # Deploy anywhere
├── telegram-miniapp.html     # Mini app demo
└── miniapp.html             # Simple mini app

__tests__/               # Test suites
├── api/                # API endpoint tests
├── bot/                # Bot functionality tests
├── database/           # Database tests
└── integration/        # End-to-end tests
```

### Adding New Features

1. **New Bot Commands**:
   - Add handler in `src/bot/handlers/commandHandler.js`
   - Register in `src/bot/index.js` 
   - Add tests in `__tests__/bot/`

2. **New API Endpoints**:
   - Create controller in `src/api/controllers/`
   - Add routes in `src/api/routes/`
   - Update Swagger documentation
   - Write tests in `__tests__/api/`

3. **New Super Admin Commands**:
   - Add to `handleSuperAdminCommand()` in `commandHandler.js`
   - Register in `superAdminCommands` array in `index.js`
   - Ensure proper permission checks

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**:
```bash
# Check if domain is allowed
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://your-api.com/api/v1/webapp/auth
```

**Authentication Failures**:
- Real Telegram auth only works in Telegram context
- Use mock data for external website testing
- Check initData format and timestamp

**Connection Issues**:
```bash
# Test API directly
curl https://your-api.com/api/v1/webapp/health

# Test with authentication
curl -X POST https://your-api.com/api/v1/webapp/auth \
     -H "X-Telegram-Init-Data: your_init_data" \
     -H "Content-Type: application/json"
```

**Rate Limiting**:
- Default: 100 requests per 15 minutes
- Auth: 5 requests per 15 minutes
- Check response headers for retry information

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Watch file changes (development)
npm run dev        # Bot with nodemon
npm run dev:api    # API with nodemon
npm run dev:examples # Examples server with nodemon
```

### Testing Super Admin Commands

```bash
# 1. Set your user ID in .env
ADMIN_USER_ID=your_telegram_user_id

# 2. Restart bot to register commands
npm run dev

# 3. Test commands in Telegram
/globalstats        # View global statistics
/maintenance on     # Enable maintenance mode
/broadcast Hello!   # Send to all groups
/forceupdate       # Refresh configurations
/clearcache        # Clear all caches
```

## 📚 Documentation

- **📖 [Complete Setup Guide](TELEGRAM_DASHBOARD_SETUP_GUIDE.md)** - Comprehensive guide for Mini Apps & External Apps
- **🔄 [Upgrade Guide](UPGRADE_GUIDE.md)** - Step-by-step upgrade instructions for existing installations
- **📝 [Changelog](CHANGELOG.md)** - Detailed version history and feature additions
- **🔧 API Docs**: `http://localhost:3000/api/docs` (Swagger UI)
- **🧪 Testing Guide**: See [Testing](#-testing) section above

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Complete Documentation

📖 **[TELEGRAM DASHBOARD SETUP GUIDE](TELEGRAM_DASHBOARD_SETUP_GUIDE.md)** - Complete guide for Mini Apps & External Apps development including:
- Detailed setup instructions  
- API endpoints reference
- Authentication systems
- Dashboard MVP features
- Super admin configuration
- Testing strategies
- Deployment guides
- Security considerations
- Troubleshooting

🔄 **[UPGRADE GUIDE](UPGRADE_GUIDE.md)** - For existing installations:
- Version upgrade instructions
- Database migration steps
- Environment variable updates
- Super admin setup
- Rollback procedures
- Troubleshooting

📝 **[CHANGELOG](CHANGELOG.md)** - Version history:
- Feature additions
- Bug fixes
- Breaking changes
- Performance improvements

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