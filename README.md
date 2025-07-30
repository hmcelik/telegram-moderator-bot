# Telegram Moderator Bot API

A comprehensive API server for Telegram bot moderation with support for Mini Apps and external website integration.

## 🚀 Features

- **Telegram Mini App Support** - Full WebApp authentication and integration
- **External Website Integration** - CORS-enabled API for any website
- **AI-Powered Moderation** - Smart content analysis with NLP
- **Security First** - Rate limiting, CORS protection, input validation
- **Developer Friendly** - Swagger documentation, comprehensive testing
- **Production Ready** - Docker support, monitoring, logging

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
   node src/api/server.js
   ```

3. **Start Development Server** (Terminal 3):
   ```bash
   node src/dev-server.js
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
- `POST /api/v1/webapp/auth` - Telegram WebApp authentication

### User Management
- `GET /api/v1/webapp/user/profile` - Get user profile
- `GET /api/v1/webapp/user/groups` - Get user's groups

### Group Management
- `GET /api/v1/webapp/group/:groupId/settings` - Get group settings
- `PUT /api/v1/webapp/group/:groupId/settings` - Update group settings
- `GET /api/v1/webapp/group/:groupId/stats` - Get group statistics

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

- ✅ **API Endpoints** - All 7 WebApp endpoints
- ✅ **Authentication** - Telegram WebApp validation
- ✅ **CORS** - Cross-origin request handling
- ✅ **Rate Limiting** - Request throttling
- ✅ **Error Handling** - Proper error responses
- ✅ **Security** - Input validation and sanitization

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
LOG_LEVEL=info
```

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

1. All services running locally
2. Use `http://localhost:8080/external` for testing
3. Perfect for development and debugging

### External Testing with Ngrok

1. **Start services**:
   ```bash
   # Terminal 1: API Server
   node src/api/server.js
   
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
npm start
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

### Adding New Endpoints

1. **Create controller** in `src/api/controllers/`
2. **Add routes** in `src/api/routes/`
3. **Update Swagger** documentation
4. **Write tests** in `__tests__/api/`
5. **Update README** if needed

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
LOG_LEVEL=debug node src/api/server.js

# Watch file changes
nodemon src/api/server.js
```

## 📚 Documentation

- **API Docs**: `http://localhost:3000/api/docs` (Swagger UI)
- **External Testing**: `EXTERNAL_WEBSITE_TESTING_GUIDE.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **API Integration**: `API_INTEGRATION_GUIDE.md`

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
- Testing strategies
- Deployment guides
- Security considerations
- Troubleshooting

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