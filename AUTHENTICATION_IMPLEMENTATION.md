# Enhanced Telegram Authentication Implementation

## Overview

The API has been enhanced to support both **Telegram Mini Apps** and **external applications** with seamless authentication through Telegram's systems.

## 🚀 **What's New**

### Enhanced Authentication Middleware
The `verifyTelegramAuth.js` middleware now supports three authentication methods:

1. **Mini App initData** (Recommended for Mini Apps)
2. **Login Widget Data** (For external web apps)  
3. **Legacy Format** (Backwards compatibility)

### Client-Side Helper Library
A comprehensive `TelegramAuth` class (`src/client/telegramAuth.js`) provides:
- Auto-context detection (Mini App vs external)
- Token management and persistence
- Easy API method wrappers
- Error handling for both contexts

### Complete Examples
- `examples/miniapp.html` - Production-ready Mini App
- `examples/external-app.html` - External web application

## 📱 **Mini App Usage**

### Method 1: Automatic (Recommended)
```javascript
import TelegramAuth from './telegramAuth.js';

const auth = new TelegramAuth('/api/v1');

// Auto-detect context and authenticate
await auth.authenticate();

// Use API methods
const groups = await auth.getGroups();
const settings = await auth.getGroupSettings(groupId);
```

### Method 2: Direct initData
```javascript
const tg = window.Telegram.WebApp;
const initData = tg.initData;

const response = await fetch('/api/v1/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData })
});
```

## 🌐 **External App Usage**

### HTML Setup
```html
<script type="module">
  import TelegramAuth from './telegramAuth.js';
  
  const auth = new TelegramAuth('/api/v1');
  
  // Setup login widget
  auth.setupLoginWidget('your_bot_username', 'login-container', {
    onSuccess: async (data) => {
      const groups = await auth.getGroups();
      // Handle successful authentication
    },
    onError: (error) => {
      console.error('Auth failed:', error);
    }
  });
</script>

<div id="login-container"></div>
```

## 🔧 **API Endpoints**

### POST /api/v1/auth/verify

**Mini App Format:**
```json
{
  "initData": "query_id=AAHdF6IQ...&user=%7B%22id%22%3A279058397...&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2"
}
```

**External App Format:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
  "auth_date": 1678886400,
  "hash": "telegram_hash_string"
}
```

**Response:**
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🧪 **Testing**

Run the enhanced authentication tests:
```bash
npm test __tests__/api/enhanced-auth.test.js
```

Tests cover:
- Mini App initData verification
- Login Widget data verification
- Legacy format support
- Error handling
- Hash validation

## 🔒 **Security Features**

1. **Telegram Hash Verification**: All authentication methods verify Telegram's cryptographic signatures
2. **JWT Tokens**: Secure session management with expiration
3. **Auto-token Refresh**: Client library handles token expiration gracefully
4. **Context Isolation**: Different token storage for Mini Apps vs external apps

## 📁 **File Structure**

```
src/
├── api/
│   └── middleware/
│       └── verifyTelegramAuth.js     # Enhanced auth middleware
└── client/
    └── telegramAuth.js               # Client helper library

examples/
├── miniapp.html                      # Mini App example
└── external-app.html                 # External app example

__tests__/
└── api/
    └── enhanced-auth.test.js         # Authentication tests
```

## 🚀 **Getting Started**

1. **For Mini Apps**: Use `examples/miniapp.html` as a starting point
2. **For External Apps**: Use `examples/external-app.html` as a starting point
3. **Replace bot username** in Login Widget setup
4. **Deploy your API** and update the `apiBaseUrl` in examples

## ⚡ **Quick Start Commands**

```bash
# Start the API server
npm run start:api

# Start development mode
npm run dev:api

# Run tests
npm test
```

## 🔗 **Integration Steps**

### Mini App Integration
1. Host your HTML file on a web server
2. Create a Telegram Mini App via @BotFather
3. Set the Mini App URL to your hosted file
4. Users can access via bot menu or inline button

### External App Integration
1. Host your HTML file with the Login Widget
2. Users visit your website
3. Click "Login with Telegram"
4. Authenticate and use the API

## 📖 **API Documentation**

See `API_DOCUMENTATION.md` for complete API reference including:
- All available endpoints
- Request/response formats
- Error handling
- Rate limiting
- Security considerations

## 🐛 **Troubleshooting**

### Common Issues:
1. **"Invalid initData format"** - Ensure you're passing the raw `initData` string
2. **"Hash verification failed"** - Check your `TELEGRAM_BOT_TOKEN` environment variable
3. **"Authentication data is missing"** - Verify request body format
4. **CORS errors** - Ensure your domain is properly configured

### Debug Tips:
- Check browser console for detailed error messages
- Verify bot token is correctly set in environment
- Test with the provided examples first
- Use network tab to inspect request/response format
