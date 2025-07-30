# Telegram Dashboard Setup Guide
## Complete Guide for Mini Apps & External Apps Development

> **Last Updated**: July 30, 2025  
> **Version**: 1.0.0  
> **Project**: Telegram Moderator Bot Dashboard  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Architecture](#project-architecture)
4. [Environment Setup](#environment-setup)
5. [Telegram Bot Configuration](#telegram-bot-configuration)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Mini App Development](#mini-app-development)
8. [External App Development](#external-app-development)
9. [Authentication System](#authentication-system)
10. [Dashboard MVP Features](#dashboard-mvp-features)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)
13. [Security Considerations](#security-considerations)
14. [Troubleshooting](#troubleshooting)
15. [Advanced Features](#advanced-features)

---

## 🎯 Overview

This guide provides a comprehensive setup for developing a **Telegram Moderator Bot Dashboard** that supports both:

- **🤖 Telegram Mini Apps**: Native apps within Telegram
- **🌐 External Web Apps**: Standalone web applications with Telegram authentication

### Key Features
- ✅ **Real-time Group Management**
- ✅ **AI-powered Moderation Settings**
- ✅ **Advanced Statistics Dashboard** 
- ✅ **User & Admin Management**
- ✅ **Cross-platform Compatibility**
- ✅ **Production-ready Security**

---

## 🔧 Prerequisites

### Required Software
```bash
# Node.js (v22.0.0+)
node --version  # Should be 22.0.0 or higher

# npm (v10.0.0+)
npm --version

# Git
git --version

# SQLite3 (for database)
sqlite3 --version
```

### Required Accounts & Tools
- 📱 **Telegram Account** (for bot creation)
- 🤖 **Bot Token** (from @BotFather)
- 🌐 **Domain** (for production deployment)
- ☁️ **Cloud Provider** (Optional: Heroku, DigitalOcean, AWS)
- 🔧 **ngrok** (for local testing)

---

## 🏗️ Project Architecture

```
telegram-moderator-bot/
├── src/
│   ├── api/                    # REST API Server
│   │   ├── server.js          # Main API server
│   │   ├── controllers/       # API controllers
│   │   │   ├── webAppController.js
│   │   │   ├── authController.js
│   │   │   └── groupController.js
│   │   ├── middleware/        # Authentication & security
│   │   │   ├── verifyTelegramWebApp.js
│   │   │   ├── checkJwt.js
│   │   │   └── verifyTelegramAuth.js
│   │   ├── routes/           # API routes
│   │   │   ├── webapp.js     # WebApp-specific routes
│   │   │   ├── auth.js       # Authentication routes
│   │   │   └── groups.js     # Group management routes
│   │   └── services/         # Business logic
│   │       └── tokenService.js
│   ├── bot/                  # Telegram Bot
│   │   ├── index.js         # Bot entry point
│   │   └── handlers/        # Message & command handlers
│   ├── common/              # Shared utilities
│   │   ├── config/          # Configuration
│   │   ├── services/        # Database, logging, NLP
│   │   └── utils/           # Helpers & enums
│   └── client/              # Client libraries
├── examples/                # Example implementations
│   ├── miniapp.html        # Mini App example
│   ├── external-website.html # External app example
│   ├── production-external-website.html # Production ready
│   └── telegramAuth.js     # Client authentication library
├── __tests__/              # Test suites
│   ├── api/               # API tests
│   ├── bot/               # Bot tests
│   └── integration/       # E2E tests
├── package.json           # Dependencies & scripts
├── swagger.json          # API documentation
└── README.md            # Project documentation
```

---

## ⚙️ Environment Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/telegram-moderator-bot.git
cd telegram-moderator-bot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Variables

Create `.env` file with the following configuration:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_bot_username

# Database Configuration
DATABASE_PATH=./moderator.db

# API Configuration
API_PORT=3000
API_BASE_URL=http://localhost:3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Security
SESSION_SECRET=your_session_secret_change_this
HELMET_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Development
DEV_SERVER_PORT=8080
NGROK_ENABLED=false
```

### 3. Database Setup

```bash
# Initialize database
npm run db:init

# Run migrations (if any)
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

---

## 🤖 Telegram Bot Configuration

### 1. Create Bot with BotFather

```
1. Open Telegram and search for @BotFather
2. Send /newbot
3. Choose a name: "YourBot Moderator"
4. Choose a username: "yourbot_moderator_bot"
5. Save the token to your .env file
```

### 2. Configure Bot Settings

```bash
# Set bot commands
/setcommands
start - Start the bot
help - Show help message
settings - Open settings dashboard
stats - View group statistics
webapp - Open Mini App

# Set Mini App URL
/newapp
# Select your bot
# App URL: https://yourdomain.com/miniapp
# OR for development: https://yourngrok.ngrok.io/miniapp

# Set Web App Button
/setmenubutton
# Select your bot
# Button text: "Dashboard"
# Web App URL: https://yourdomain.com/miniapp
```

### 3. Bot Permissions Setup

```bash
# Set bot as group admin with these permissions:
- Delete messages
- Restrict members  
- Pin messages
- Invite users
- Manage topics (for supergroups)
```

---

## 🔌 API Endpoints Reference

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://yourdomain.com/api/v1`

### Authentication Endpoints

#### WebApp Authentication
```http
POST /webapp/auth
Content-Type: application/json
X-Telegram-Init-Data: [Telegram initData]

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 123456789,
    "username": "user123",
    "first_name": "John"
  }
}
```

#### Legacy Authentication (External Apps)
```http
POST /auth/verify
Content-Type: application/json

{
  "id": 123456789,
  "username": "user123",
  "first_name": "John",
  "auth_date": 1640995200,
  "hash": "telegram_hash"
}

Response:
{
  "success": true,
  "token": "jwt_token_here"
}
```

### User Management Endpoints

#### Get User Profile
```http
GET /webapp/user/profile
Authorization: Bearer {jwt_token}
X-Telegram-Init-Data: [initData]

Response:
{
  "success": true,
  "user": {
    "id": 123456789,
    "username": "user123",
    "first_name": "John",
    "is_premium": false,
    "groups_count": 5,
    "last_seen": "2025-07-30T10:00:00Z"
  }
}
```

#### Get User Groups
```http
GET /webapp/user/groups
Authorization: Bearer {jwt_token}
X-Telegram-Init-Data: [initData]

Response:
{
  "success": true,
  "groups": [
    {
      "id": "-1001234567890",
      "title": "My Awesome Group",
      "type": "supergroup",
      "member_count": 150,
      "user_role": "administrator",
      "moderation_enabled": true
    }
  ]
}
```

### Group Management Endpoints

#### Get Group Settings
```http
GET /webapp/group/{groupId}/settings
Authorization: Bearer {jwt_token}
X-Telegram-Init-Data: [initData]

Response:
{
  "success": true,
  "settings": {
    "ai_moderation": {
      "enabled": true,
      "sensitivity": "medium",
      "auto_delete": true
    },
    "keyword_filter": {
      "enabled": true,
      "keywords": ["spam", "prohibited"],
      "action": "delete"
    },
    "whitelist": {
      "enabled": false,
      "users": [],
      "links": []
    },
    "penalty_system": {
      "enabled": true,
      "max_warnings": 3,
      "ban_duration": 24
    }
  }
}
```

#### Update Group Settings
```http
PUT /webapp/group/{groupId}/settings
Authorization: Bearer {jwt_token}
X-Telegram-Init-Data: [initData]
Content-Type: application/json

{
  "settings": {
    "ai_moderation": {
      "enabled": true,
      "sensitivity": "high"
    }
  }
}

Response:
{
  "success": true,
  "message": "Settings updated successfully"
}
```

#### Get Group Statistics
```http
GET /webapp/group/{groupId}/stats?period=week
Authorization: Bearer {jwt_token}
X-Telegram-Init-Data: [initData]

Response:
{
  "success": true,
  "stats": {
    "period": "week",
    "messages_processed": 1250,
    "spam_detected": 45,
    "users_warned": 12,
    "users_banned": 2,
    "ai_accuracy": 94.5,
    "top_violations": [
      {"type": "spam", "count": 28},
      {"type": "inappropriate", "count": 17}
    ]
  }
}
```

### Utility Endpoints

#### Health Check
```http
GET /webapp/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-07-30T10:00:00Z",
  "features": {
    "webAppSupport": true,
    "cors": true,
    "rateLimit": true
  }
}
```

#### API Documentation
```http
GET /api/docs
```
Opens Swagger UI documentation

---

## 📱 Mini App Development

### 1. Basic Mini App Structure

Create `miniapp.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moderator Bot Dashboard</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="./telegramAuth.js"></script>
    <style>
        /* Telegram-native styling */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .card {
            background: var(--tg-theme-section-bg-color, #f8f9fa);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            border: 1px solid var(--tg-theme-section-separator-color, #e1e5e9);
        }
        
        .button {
            background: var(--tg-theme-button-color, #3390ec);
            color: var(--tg-theme-button-text-color, #ffffff);
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            margin-top: 12px;
        }
        
        .button:hover {
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-top: 16px;
        }
        
        .stat-item {
            text-align: center;
            padding: 12px;
            background: var(--tg-theme-secondary-bg-color, #efeff3);
            border-radius: 8px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--tg-theme-accent-text-color, #3390ec);
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--tg-theme-subtitle-text-color, #999999);
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🤖 Moderator Dashboard</h1>
            <p id="welcome-message">Loading...</p>
        </div>

        <div class="card" id="groups-section" style="display: none;">
            <h2>📱 Your Groups</h2>
            <div id="groups-list"></div>
        </div>

        <div class="card" id="stats-section" style="display: none;">
            <h2>📊 Statistics</h2>
            <div class="stats-grid" id="stats-grid"></div>
        </div>

        <div class="card" id="settings-section" style="display: none;">
            <h2>⚙️ Quick Settings</h2>
            <div id="settings-controls"></div>
        </div>
    </div>

    <script>
        class MiniAppDashboard {
            constructor() {
                this.auth = new TelegramAuth('/api/v1');
                this.tg = window.Telegram.WebApp;
                this.currentGroup = null;
                this.init();
            }

            async init() {
                // Initialize Telegram WebApp
                this.tg.ready();
                this.tg.expand();
                
                // Set main button
                this.tg.MainButton.setText('Refresh Data');
                this.tg.MainButton.onClick(() => this.loadDashboard());
                this.tg.MainButton.show();

                try {
                    await this.authenticate();
                    await this.loadDashboard();
                } catch (error) {
                    this.showError(error.message);
                }
            }

            async authenticate() {
                try {
                    const authData = await this.auth.authenticateWithMiniApp();
                    document.getElementById('welcome-message').textContent = 
                        `Welcome, ${authData.user.first_name || 'User'}! 👋`;
                } catch (error) {
                    throw new Error('Authentication failed: ' + error.message);
                }
            }

            async loadDashboard() {
                try {
                    this.tg.MainButton.showProgress();
                    
                    // Load user groups
                    const groups = await this.auth.getGroups();
                    this.displayGroups(groups.groups);
                    
                    // Load statistics for first group
                    if (groups.groups.length > 0) {
                        this.currentGroup = groups.groups[0];
                        const stats = await this.auth.getGroupStats(this.currentGroup.id);
                        this.displayStats(stats.stats);
                        
                        const settings = await this.auth.getGroupSettings(this.currentGroup.id);
                        this.displaySettings(settings.settings);
                    }
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    this.tg.MainButton.hideProgress();
                }
            }

            displayGroups(groups) {
                const groupsList = document.getElementById('groups-list');
                const groupsSection = document.getElementById('groups-section');
                
                groupsList.innerHTML = '';
                
                groups.forEach(group => {
                    const groupElement = document.createElement('div');
                    groupElement.className = 'card';
                    groupElement.innerHTML = `
                        <h3>${group.title}</h3>
                        <p>👥 ${group.member_count} members</p>
                        <p>🔒 Role: ${group.user_role}</p>
                        <button class="button" onclick="dashboard.selectGroup('${group.id}')">
                            Manage Group
                        </button>
                    `;
                    groupsList.appendChild(groupElement);
                });
                
                groupsSection.style.display = 'block';
            }

            displayStats(stats) {
                const statsGrid = document.getElementById('stats-grid');
                const statsSection = document.getElementById('stats-section');
                
                statsGrid.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-value">${stats.messages_processed}</div>
                        <div class="stat-label">Messages</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.spam_detected}</div>
                        <div class="stat-label">Spam Blocked</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.users_warned}</div>
                        <div class="stat-label">Warnings</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.ai_accuracy}%</div>
                        <div class="stat-label">AI Accuracy</div>
                    </div>
                `;
                
                statsSection.style.display = 'block';
            }

            displaySettings(settings) {
                const settingsControls = document.getElementById('settings-controls');
                const settingsSection = document.getElementById('settings-section');
                
                settingsControls.innerHTML = `
                    <div style="margin-bottom: 16px;">
                        <label>
                            <input type="checkbox" ${settings.ai_moderation.enabled ? 'checked' : ''} 
                                   onchange="dashboard.toggleAIModeration(this.checked)">
                            AI Moderation
                        </label>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label>
                            Sensitivity: 
                            <select onchange="dashboard.updateSensitivity(this.value)">
                                <option value="low" ${settings.ai_moderation.sensitivity === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${settings.ai_moderation.sensitivity === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${settings.ai_moderation.sensitivity === 'high' ? 'selected' : ''}>High</option>
                            </select>
                        </label>
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" ${settings.keyword_filter.enabled ? 'checked' : ''} 
                                   onchange="dashboard.toggleKeywordFilter(this.checked)">
                            Keyword Filter
                        </label>
                    </div>
                `;
                
                settingsSection.style.display = 'block';
            }

            async selectGroup(groupId) {
                try {
                    this.tg.MainButton.showProgress();
                    
                    const stats = await this.auth.getGroupStats(groupId);
                    this.displayStats(stats.stats);
                    
                    const settings = await this.auth.getGroupSettings(groupId);
                    this.displaySettings(settings.settings);
                    
                    this.currentGroup = { id: groupId };
                } catch (error) {
                    this.showError(error.message);
                } finally {
                    this.tg.MainButton.hideProgress();
                }
            }

            async toggleAIModeration(enabled) {
                if (!this.currentGroup) return;
                
                try {
                    await this.auth.updateGroupSettings(this.currentGroup.id, {
                        ai_moderation: { enabled }
                    });
                    
                    this.tg.showAlert('Settings updated successfully!');
                } catch (error) {
                    this.showError(error.message);
                }
            }

            async updateSensitivity(sensitivity) {
                if (!this.currentGroup) return;
                
                try {
                    await this.auth.updateGroupSettings(this.currentGroup.id, {
                        ai_moderation: { sensitivity }
                    });
                    
                    this.tg.showAlert('Sensitivity updated!');
                } catch (error) {
                    this.showError(error.message);
                }
            }

            async toggleKeywordFilter(enabled) {
                if (!this.currentGroup) return;
                
                try {
                    await this.auth.updateGroupSettings(this.currentGroup.id, {
                        keyword_filter: { enabled }
                    });
                    
                    this.tg.showAlert('Keyword filter updated!');
                } catch (error) {
                    this.showError(error.message);
                }
            }

            showError(message) {
                this.tg.showAlert(`Error: ${message}`);
                console.error('Dashboard Error:', message);
            }
        }

        // Initialize dashboard
        const dashboard = new MiniAppDashboard();
    </script>
</body>
</html>
```

### 2. Mini App Testing

```bash
# Start API server
npm run start:api

# Start dev server
npm run start:dev-server

# Test mini app at:
# http://localhost:8080/miniapp.html
```

---

## 🌐 External App Development

### 1. External App Structure

Create `external-dashboard.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram Moderator Dashboard</title>
    <script src="./telegramAuth.js"></script>
    <style>
        /* Modern external app styling */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .navbar {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 16px 24px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-top: 24px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-4px);
        }
        
        .auth-section {
            text-align: center;
            padding: 48px 24px;
        }
        
        .login-button {
            background: #0088cc;
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 32px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 24px;
        }
        
        .login-button:hover {
            background: #006ba8;
            transform: translateY(-2px);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 16px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 12px;
            color: white;
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1>🤖 Telegram Moderator Dashboard</h1>
        <div id="user-info" class="hidden"></div>
    </nav>

    <div class="container">
        <div id="auth-section" class="auth-section">
            <h2>Welcome to Telegram Moderator Dashboard</h2>
            <p>Manage your Telegram groups with AI-powered moderation</p>
            
            <div id="telegram-login-container">
                <p>Click the button below to login with Telegram:</p>
                <button class="login-button" onclick="dashboard.showMockLogin()">
                    🚀 Login with Telegram (Demo)
                </button>
                <div id="telegram-login" style="margin-top: 16px;"></div>
            </div>
        </div>

        <div id="dashboard-content" class="hidden">
            <div class="dashboard-grid">
                <div class="card">
                    <h3>📱 Your Groups</h3>
                    <div id="groups-list"></div>
                </div>

                <div class="card">
                    <h3>📊 Quick Stats</h3>
                    <div id="quick-stats"></div>
                </div>

                <div class="card">
                    <h3>⚙️ Settings</h3>
                    <div id="settings-panel"></div>
                </div>

                <div class="card">
                    <h3>🔍 Recent Activity</h3>
                    <div id="recent-activity"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        class ExternalDashboard {
            constructor() {
                this.auth = new TelegramAuth('http://localhost:3000/api/v1');
                this.userData = null;
                this.init();
            }

            init() {
                // Try to authenticate if token exists
                this.checkExistingAuth();
            }

            async checkExistingAuth() {
                const token = localStorage.getItem('telegram_token');
                if (token) {
                    this.auth.token = token;
                    try {
                        const profile = await this.auth.getUserProfile();
                        this.userData = profile.user;
                        this.showDashboard();
                    } catch (error) {
                        console.log('Existing token invalid');
                        localStorage.removeItem('telegram_token');
                    }
                }
            }

            showMockLogin() {
                // For demo purposes, create mock user data
                const mockUser = {
                    id: Math.floor(Math.random() * 1000000),
                    username: 'demo_user',
                    first_name: 'Demo',
                    last_name: 'User',
                    auth_date: Math.floor(Date.now() / 1000)
                };

                this.loginWithMockData(mockUser);
            }

            async loginWithMockData(userData) {
                try {
                    const authResponse = await this.auth.authenticateWithLoginWidget(userData);
                    this.userData = authResponse.user;
                    this.showDashboard();
                } catch (error) {
                    alert('Login failed: ' + error.message);
                }
            }

            showDashboard() {
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('dashboard-content').classList.remove('hidden');
                
                // Update user info
                document.getElementById('user-info').innerHTML = `
                    Welcome, ${this.userData.first_name}! 
                    <button onclick="dashboard.logout()" style="margin-left: 16px; padding: 8px 16px; border: none; border-radius: 6px; background: #f44336; color: white; cursor: pointer;">
                        Logout
                    </button>
                `;
                document.getElementById('user-info').classList.remove('hidden');

                this.loadDashboardData();
            }

            async loadDashboardData() {
                try {
                    // Load groups
                    const groupsResponse = await this.auth.getGroups();
                    this.displayGroups(groupsResponse.groups);

                    // Load stats for first group if available
                    if (groupsResponse.groups.length > 0) {
                        const firstGroup = groupsResponse.groups[0];
                        const statsResponse = await this.auth.getGroupStats(firstGroup.id);
                        this.displayQuickStats(statsResponse.stats);

                        const settingsResponse = await this.auth.getGroupSettings(firstGroup.id);
                        this.displaySettings(settingsResponse.settings, firstGroup.id);
                    }

                    this.displayRecentActivity();
                } catch (error) {
                    console.error('Failed to load dashboard data:', error);
                }
            }

            displayGroups(groups) {
                const groupsList = document.getElementById('groups-list');
                groupsList.innerHTML = '';

                if (groups.length === 0) {
                    groupsList.innerHTML = '<p>No groups found. Add the bot to a group as an admin!</p>';
                    return;
                }

                groups.forEach(group => {
                    const groupElement = document.createElement('div');
                    groupElement.style.cssText = 'padding: 12px; margin: 8px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #0088cc;';
                    groupElement.innerHTML = `
                        <h4>${group.title}</h4>
                        <p>👥 ${group.member_count} members</p>
                        <p>🔒 Role: ${group.user_role}</p>
                        <button onclick="dashboard.manageGroup('${group.id}')" 
                                style="margin-top: 8px; padding: 6px 12px; background: #0088cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Manage
                        </button>
                    `;
                    groupsList.appendChild(groupElement);
                });
            }

            displayQuickStats(stats) {
                const quickStats = document.getElementById('quick-stats');
                quickStats.innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div style="font-size: 24px; font-weight: bold;">${stats.messages_processed}</div>
                            <div style="font-size: 12px; margin-top: 4px;">Messages</div>
                        </div>
                        <div class="stat-item">
                            <div style="font-size: 24px; font-weight: bold;">${stats.spam_detected}</div>
                            <div style="font-size: 12px; margin-top: 4px;">Spam Blocked</div>
                        </div>
                        <div class="stat-item">
                            <div style="font-size: 24px; font-weight: bold;">${stats.users_warned}</div>
                            <div style="font-size: 12px; margin-top: 4px;">Warnings</div>
                        </div>
                        <div class="stat-item">
                            <div style="font-size: 24px; font-weight: bold;">${stats.ai_accuracy}%</div>
                            <div style="font-size: 12px; margin-top: 4px;">AI Accuracy</div>
                        </div>
                    </div>
                `;
            }

            displaySettings(settings, groupId) {
                const settingsPanel = document.getElementById('settings-panel');
                settingsPanel.innerHTML = `
                    <div style="margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${settings.ai_moderation.enabled ? 'checked' : ''} 
                                   onchange="dashboard.toggleSetting('${groupId}', 'ai_moderation', 'enabled', this.checked)">
                            <span>AI Moderation</span>
                        </label>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 4px;">Sensitivity Level:</label>
                        <select onchange="dashboard.updateSetting('${groupId}', 'ai_moderation', 'sensitivity', this.value)"
                                style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            <option value="low" ${settings.ai_moderation.sensitivity === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${settings.ai_moderation.sensitivity === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${settings.ai_moderation.sensitivity === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${settings.keyword_filter.enabled ? 'checked' : ''} 
                                   onchange="dashboard.toggleSetting('${groupId}', 'keyword_filter', 'enabled', this.checked)">
                            <span>Keyword Filter</span>
                        </label>
                    </div>
                `;
            }

            displayRecentActivity() {
                const recentActivity = document.getElementById('recent-activity');
                recentActivity.innerHTML = `
                    <div style="font-size: 14px; color: #666;">
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            🚫 Blocked spam message in "Tech Group"
                            <div style="font-size: 12px; color: #999;">2 minutes ago</div>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            ⚠️ Warned user @spammer123
                            <div style="font-size: 12px; color: #999;">5 minutes ago</div>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            ✅ AI moderation sensitivity updated
                            <div style="font-size: 12px; color: #999;">1 hour ago</div>
                        </div>
                        <div style="padding: 8px 0;">
                            👥 New member joined "Gaming Group"
                            <div style="font-size: 12px; color: #999;">2 hours ago</div>
                        </div>
                    </div>
                `;
            }

            async toggleSetting(groupId, category, setting, value) {
                try {
                    const settings = {};
                    settings[category] = {};
                    settings[category][setting] = value;
                    
                    await this.auth.updateGroupSettings(groupId, settings);
                    alert('Setting updated successfully!');
                } catch (error) {
                    alert('Failed to update setting: ' + error.message);
                }
            }

            async updateSetting(groupId, category, setting, value) {
                try {
                    const settings = {};
                    settings[category] = {};
                    settings[category][setting] = value;
                    
                    await this.auth.updateGroupSettings(groupId, settings);
                    alert('Setting updated successfully!');
                } catch (error) {
                    alert('Failed to update setting: ' + error.message);
                }
            }

            manageGroup(groupId) {
                alert(`Managing group ${groupId} - This would open detailed group management interface`);
            }

            logout() {
                localStorage.removeItem('telegram_token');
                this.auth.token = null;
                this.userData = null;
                
                document.getElementById('dashboard-content').classList.add('hidden');
                document.getElementById('auth-section').classList.remove('hidden');
                document.getElementById('user-info').classList.add('hidden');
            }
        }

        // Initialize dashboard
        const dashboard = new ExternalDashboard();
    </script>
</body>
</html>
```

---

## 🔐 Authentication System

### 1. Mini App Authentication Flow

```javascript
// Mini App uses Telegram's initData for authentication
const initData = window.Telegram.WebApp.initData;

// Send to server for validation
const response = await fetch('/api/v1/webapp/auth', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
    }
});
```

### 2. External App Authentication Flow

```javascript
// External apps use Login Widget or mock data
const userData = {
    id: 123456789,
    username: 'user123',
    first_name: 'John',
    auth_date: Math.floor(Date.now() / 1000),
    hash: 'telegram_provided_hash'
};

const response = await fetch('/api/v1/auth/verify', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
});
```

### 3. JWT Token Management

```javascript
// Store JWT token
localStorage.setItem('telegram_token', token);

// Use token in subsequent requests
const apiResponse = await fetch('/api/v1/webapp/user/profile', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'X-Telegram-Init-Data': initData
    }
});
```

---

## 📊 Dashboard MVP Features

### Core Features (Phase 1)
1. **🔐 User Authentication**
   - Telegram Mini App login
   - External app login with Login Widget
   - JWT token management

2. **📱 Group Management**
   - List user's groups
   - View group details
   - Admin permission validation

3. **⚙️ Settings Configuration**
   - AI moderation on/off
   - Sensitivity levels (low/medium/high)
   - Keyword filter management

4. **📊 Basic Statistics**
   - Messages processed
   - Spam blocked
   - Users warned/banned
   - AI accuracy percentage

### Enhanced Features (Phase 2)
1. **📈 Advanced Analytics**
   - Time-series charts
   - Trend analysis
   - Custom date ranges
   - Export reports

2. **🎛️ Advanced Settings**
   - Custom keyword lists
   - Whitelist management
   - Penalty system configuration
   - Auto-moderation rules

3. **👥 User Management**
   - User profiles
   - Warning history
   - Ban management
   - Admin role assignment

4. **🔔 Real-time Notifications**
   - Live moderation events
   - Alert system
   - Telegram notifications
   - Email reports

### Premium Features (Phase 3)
1. **🤖 AI Training**
   - Custom model training
   - False positive feedback
   - Custom classification
   - Industry-specific models

2. **📋 Compliance & Audit**
   - Moderation logs
   - Compliance reports
   - Audit trails
   - Legal documentation

3. **🔌 Integrations**
   - Webhook support
   - Third-party APIs
   - Custom plugins
   - Multi-platform support

---

## 🧪 Testing Strategy

### 1. Unit Tests

```javascript
// Run unit tests
npm test

// Test specific modules
npm test -- --run src/api/controllers/webAppController.test.js
npm test -- --run src/bot/handlers/commandHandler.test.js
```

### 2. Integration Tests

```javascript
// Test API endpoints
npm test -- --run __tests__/integration/e2e.test.js

// Test authentication flow
npm test -- --run __tests__/api/enhanced-auth.test.js
```

### 3. Manual Testing Checklist

#### Mini App Testing
- [ ] App loads correctly in Telegram
- [ ] Authentication works
- [ ] All API calls succeed
- [ ] UI adapts to Telegram theme
- [ ] Main button functions
- [ ] Back button handling
- [ ] Error handling works

#### External App Testing
- [ ] Login widget functions
- [ ] Authentication flow works
- [ ] All features accessible
- [ ] Responsive design
- [ ] Cross-browser compatibility
- [ ] Token persistence
- [ ] Logout functionality

#### API Testing
- [ ] All endpoints respond correctly
- [ ] Authentication middleware works
- [ ] Rate limiting functions
- [ ] CORS headers correct
- [ ] Error responses proper
- [ ] Swagger documentation accurate

### 4. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
echo "config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'WebApp Auth Test'
    requests:
      - post:
          url: '/api/v1/webapp/auth'
          headers:
            X-Telegram-Init-Data: 'mock_data'
" > load-test.yml

# Run load test
artillery run load-test.yml
```

---

## 🚀 Deployment Guide

### 1. Local Development

```bash
# Start all services
npm run start:api &          # API server on :3000
npm run start:dev-server &   # Dev server on :8080
npm run start &              # Bot service

# Or use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### 2. ngrok for External Testing

```bash
# Install ngrok
npm install -g ngrok

# Expose API server
ngrok http 3000

# Update bot webhook (if needed)
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-ngrok-url.ngrok.io/webhook"}'
```

### 3. Production Deployment

#### Option A: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Set webhook
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app-name.herokuapp.com/webhook"}'
```

#### Option B: DigitalOcean Droplet
```bash
# Create and setup droplet
ssh root@your-droplet-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/telegram-moderator-bot.git
cd telegram-moderator-bot

# Install dependencies
npm install --production

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Setup Nginx reverse proxy
apt install nginx
nano /etc/nginx/sites-available/telegram-bot

# Nginx config:
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site and restart Nginx
ln -s /etc/nginx/sites-available/telegram-bot /etc/nginx/sites-enabled/
systemctl restart nginx

# Setup SSL with Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

#### Option C: Docker Deployment
```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start:api"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  bot:
    build: .
    command: npm start
    environment:
      - NODE_ENV=production
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    depends_on:
      - api
```

```bash
# Deploy with Docker
docker-compose up -d
```

---

## 🔒 Security Considerations

### 1. Authentication Security
```javascript
// Implement proper HMAC validation
const crypto = require('crypto');

function validateTelegramData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
}
```

### 2. Rate Limiting
```javascript
// Implement strict rate limiting
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/v1/webapp/auth', authLimiter);
```

### 3. Environment Security
```bash
# Production environment variables
NODE_ENV=production
TELEGRAM_BOT_TOKEN=secure_token_here
JWT_SECRET=complex_secret_key_minimum_32_chars
DATABASE_URL=encrypted_database_connection
API_ENCRYPTION_KEY=api_encryption_key
SESSION_SECRET=session_secret_key
ALLOWED_ORIGINS=https://yourdomain.com,https://yourapp.com
```

### 4. Database Security
```javascript
// Use parameterized queries
const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
const user = stmt.get(telegramId);

// Encrypt sensitive data
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { encrypted: encrypted.toString('hex'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Authentication Failures
```
Error: "Invalid initData hash"
Solution:
- Check bot token in environment
- Verify HMAC validation logic
- Check Telegram WebApp SDK version
- Ensure proper URL encoding
```

#### 2. CORS Issues
```
Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
Solution:
- Add domain to ALLOWED_ORIGINS in .env
- Check CORS middleware configuration
- Verify request origin
- Use HTTPS in production
```

#### 3. Rate Limiting
```
Error: "Too many requests"
Solution:
- Implement exponential backoff
- Cache API responses
- Optimize request frequency
- Contact support for limit increase
```

#### 4. Database Connection Issues
```
Error: "SQLITE_BUSY: database is locked"
Solution:
- Implement connection pooling
- Use WAL mode: PRAGMA journal_mode=WAL
- Add retry logic with backoff
- Check file permissions
```

#### 5. Mini App Not Loading
```
Issue: White screen in Telegram
Solution:
- Check console for JavaScript errors
- Verify HTTPS in production
- Check Content Security Policy
- Validate HTML structure
- Test WebApp API availability
```

### Debug Mode Setup
```javascript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.body,
        query: req.query
    });
    next();
});
```

---

## 🚀 Advanced Features

### 1. Real-time Updates with WebSockets
```javascript
// Add socket.io for real-time updates
const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true
    }
});

// Emit real-time moderation events
io.to(`group_${groupId}`).emit('moderation_event', {
    type: 'spam_detected',
    message: 'Spam message blocked',
    timestamp: new Date().toISOString()
});
```

### 2. Push Notifications
```javascript
// Implement Web Push notifications
const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:admin@yourdomain.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Send notification
const payload = JSON.stringify({
    title: 'Spam Detected',
    body: 'AI detected spam in your group',
    icon: '/icon-192x192.png',
    data: { groupId, messageId }
});

webpush.sendNotification(subscription, payload);
```

### 3. Analytics Dashboard
```javascript
// Add advanced analytics
const analytics = {
    async getDetailedStats(groupId, period) {
        const stats = await db.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as messages,
                SUM(CASE WHEN is_spam = 1 THEN 1 ELSE 0 END) as spam_count,
                AVG(confidence_score) as avg_confidence
            FROM moderation_logs 
            WHERE group_id = ? 
                AND created_at >= datetime('now', '-${period} days')
            GROUP BY DATE(created_at)
            ORDER BY date
        `, [groupId]);
        
        return stats;
    }
};
```

### 4. Custom AI Training
```javascript
// Allow custom model training
const trainCustomModel = async (groupId, trainingData) => {
    const model = await tf.loadLayersModel('/models/base-model.json');
    
    // Fine-tune with group-specific data
    const xs = tf.tensor2d(trainingData.features);
    const ys = tf.tensor2d(trainingData.labels);
    
    await model.fit(xs, ys, {
        epochs: 10,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
            }
        }
    });
    
    // Save group-specific model
    await model.save(`file://./models/group_${groupId}`);
};
```

---

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_moderation_logs_group_date ON moderation_logs(group_id, created_at);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_groups_admin_users ON group_admins(group_id, user_id);

-- Use WAL mode for better concurrency
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

### 2. API Response Caching
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cache group settings
app.get('/api/v1/webapp/group/:groupId/settings', async (req, res) => {
    const cacheKey = `settings_${req.params.groupId}`;
    let settings = cache.get(cacheKey);
    
    if (!settings) {
        settings = await getGroupSettings(req.params.groupId);
        cache.set(cacheKey, settings);
    }
    
    res.json({ success: true, settings });
});
```

### 3. Frontend Optimization
```javascript
// Implement lazy loading
const LazyComponent = React.lazy(() => import('./AdvancedSettings'));

// Use service workers for caching
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// Optimize bundle size
const webpack = require('webpack');
module.exports = {
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                }
            }
        }
    }
};
```

---

## 📚 Additional Resources

### Documentation Links
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [JWT Authentication](https://jwt.io/introduction)

### Example Repositories
- [Telegram WebApp Examples](https://github.com/telegram/webapps)
- [Express API Boilerplate](https://github.com/express/examples)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Tools & Services
- [ngrok - Secure Tunnels](https://ngrok.com/)
- [Postman - API Testing](https://postman.com/)
- [Artillery - Load Testing](https://artillery.io/)
- [PM2 - Process Manager](https://pm2.keymetrics.io/)

---

## 📞 Support & Contributing

### Getting Help
1. Check this documentation first
2. Review the troubleshooting section
3. Search existing GitHub issues
4. Create a new issue with:
   - Environment details
   - Error messages
   - Steps to reproduce
   - Expected vs actual behavior

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

### License
This project is licensed under the MIT License. See `LICENSE` file for details.

---

**🎉 You're all set!** This comprehensive guide should help you build a production-ready Telegram Moderator Bot Dashboard with both Mini App and External App support. Start with the MVP features and gradually add advanced functionality as needed.

For questions or support, feel free to open an issue in the repository or contact the development team.
