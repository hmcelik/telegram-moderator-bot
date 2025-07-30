# Upgrade Guide

This guide helps you upgrade your existing Telegram Moderator Bot installation to the latest version with super admin functionality and enhanced features.

## 🔄 Version 1.2.0 Upgrade (Latest)

### New Features Summary
- **Super Admin Commands** - Global bot management capabilities
- **Enhanced API** - WebApp-specific endpoints and improved authentication
- **Role-based Command Registration** - Automatic command registration based on permissions
- **Improved Development Workflow** - Better npm scripts and development tools
- **ES Module Compatibility** - Full ES6 module support

### Prerequisites
- Node.js 22.0.0 or higher
- Existing installation of Telegram Moderator Bot
- Access to your environment configuration

---

## 📋 Upgrade Steps

### 1. Backup Current Installation

```bash
# Backup your database
cp moderator.db moderator.db.backup

# Backup your environment file
cp .env .env.backup

# Backup any custom configurations
tar -czf bot-backup-$(date +%Y%m%d).tar.gz moderator.db .env src/
```

### 2. Update Codebase

```bash
# Stop all running services
# Ctrl+C in all terminals or:
pkill -f "node.*bot"
pkill -f "node.*api"

# Pull latest changes
git fetch origin
git pull origin main

# Update dependencies
npm install
```

### 3. Update Environment Variables

Add new environment variables to your `.env` file:

```bash
# Add these new variables to your existing .env:

# Super Admin Configuration (REQUIRED for super admin commands)
ADMIN_USER_ID=your_telegram_user_id

# Development Server Port (if not set)
DEV_SERVER_PORT=8080

# Maintenance Mode (if not set)
MAINTENANCE_MODE=false

# Ensure these existing variables are properly set:
BOT_TOKEN=your_bot_token
TELEGRAM_BOT_SECRET=your_bot_secret
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
DATABASE_PATH=./moderator.db
API_PORT=3000
LOG_LEVEL=info
```

#### Getting Your Telegram User ID

If you don't know your Telegram user ID:

1. **Message [@userinfobot](https://t.me/userinfobot)** on Telegram
2. **Copy the user ID** (e.g., 123456789)
3. **Add to .env file**:
   ```bash
   ADMIN_USER_ID=123456789
   ```

### 4. Database Migration

The database will automatically migrate when you start the bot. No manual migration needed.

```bash
# The bot will automatically:
# - Create new tables if needed
# - Update existing schemas
# - Preserve all existing data
```

### 5. Update Development Workflow

If you were using custom start commands, update them:

```bash
# Old way:
node src/bot/index.js
node src/api/server.js
node src/dev-server.js

# New way (recommended):
npm run dev              # Bot with auto-reload
npm run dev:api          # API with auto-reload  
npm run dev:examples     # Examples with auto-reload
```

### 6. Test Super Admin Commands

After restarting the bot:

```bash
# Start the bot
npm run dev

# In Telegram, test super admin commands:
/globalstats        # Should show global statistics
/maintenance status # Should show current maintenance status
/help              # Should show super admin commands in the list
```

### 7. Verify API Changes

Test the new WebApp-specific endpoints:

```bash
# Test health endpoint
curl http://localhost:3000/api/v1/webapp/health

# Test new WebApp group endpoints
curl -X GET http://localhost:3000/api/v1/webapp/group/GROUP_ID/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Telegram-Init-Data: INIT_DATA"
```

---

## 🧪 Post-Upgrade Testing

### 1. Run Test Suite

```bash
# Run all tests to ensure everything works
npm test

# Expected: 152 tests passing across 15 suites
```

### 2. Verify Bot Functionality

- [ ] **Bot starts without errors**
- [ ] **Commands are registered properly** (check with `/help`)
- [ ] **Super admin commands appear** for configured user
- [ ] **Existing groups still work** with moderation
- [ ] **API endpoints respond** correctly
- [ ] **WebApp endpoints work** (if using Mini Apps)

### 3. Check Logs

```bash
# Check for any errors or warnings
tail -f combined.log
tail -f error.log

# Look for these success messages:
# ✅ Bot commands registered successfully
# ✅ Super admin commands registered for user [USER_ID]
# ✅ API server started on port 3000
```

---

## 🔧 Troubleshooting

### Common Issues

#### Super Admin Commands Not Working

**Problem**: Super admin commands don't appear or don't work.

**Solution**:
```bash
# 1. Check environment variable
echo $ADMIN_USER_ID

# 2. Verify it matches your Telegram user ID
# Message @userinfobot to double-check

# 3. Restart the bot
npm run dev

# 4. Look for registration message in logs
grep "Super admin" combined.log
```

#### Database Errors

**Problem**: Database-related errors after upgrade.

**Solution**:
```bash
# 1. Check database file exists
ls -la moderator.db*

# 2. Check permissions
chmod 644 moderator.db

# 3. If corrupted, restore from backup
cp moderator.db.backup moderator.db
npm run dev
```

#### API Endpoints Not Working

**Problem**: New WebApp endpoints return 404.

**Solution**:
```bash
# 1. Restart API server
npm run dev:api

# 2. Check Swagger documentation
# Visit: http://localhost:3000/api/docs

# 3. Verify endpoint URLs match new format
# Use /api/v1/webapp/ prefix for WebApp endpoints
```

#### ES Module Errors

**Problem**: "require() is not defined" or module import errors.

**Solution**:
```bash
# 1. Ensure package.json has correct type
grep '"type": "module"' package.json

# 2. Update Node.js if needed
node --version  # Should be 22.0.0 or higher

# 3. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Rollback Procedure

If you encounter issues and need to rollback:

```bash
# 1. Stop all services
pkill -f "node.*bot"

# 2. Restore database backup
cp moderator.db.backup moderator.db

# 3. Restore environment backup  
cp .env.backup .env

# 4. Checkout previous version
git log --oneline -10  # Find previous commit
git checkout [PREVIOUS_COMMIT_HASH]

# 5. Reinstall dependencies
npm install

# 6. Start with old commands
node src/bot/index.js
```

---

## 📚 New Features Documentation

### Super Admin Commands

Once upgraded, you'll have access to these new commands:

- **`/globalstats`** - View global bot statistics across all groups
- **`/maintenance on|off`** - Toggle maintenance mode
- **`/broadcast <message>`** - Send announcements to all groups  
- **`/forceupdate`** - Force refresh bot configurations
- **`/clearcache`** - Clear all cached data

### Enhanced Development

New npm scripts for better development experience:

```bash
npm run dev              # Bot with nodemon auto-reload
npm run dev:api          # API server with auto-reload
npm run dev:examples     # Examples server with auto-reload
npm test                 # Run 152 tests
npm run test:watch       # Tests in watch mode
```

### WebApp API Improvements

New endpoints specifically for Telegram Mini Apps:

- `GET /api/v1/webapp/group/:groupId/settings`
- `PUT /api/v1/webapp/group/:groupId/settings`  
- `GET /api/v1/webapp/group/:groupId/stats`

---

## 🎉 Upgrade Complete

After following this guide, you should have:

- ✅ **Super admin functionality** working
- ✅ **Enhanced API endpoints** available
- ✅ **Improved development workflow** 
- ✅ **All tests passing** (152/152)
- ✅ **Better command registration** system
- ✅ **ES module compatibility**

For questions or issues, check the [main README](README.md) or [setup guide](TELEGRAM_DASHBOARD_SETUP_GUIDE.md).
