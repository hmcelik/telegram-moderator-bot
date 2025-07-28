# Telegram Moderator Bot API Documentation

## Overview
The Telegram Moderator Bot API provides REST endpoints for managing AI-powered moderation settings and user data for Telegram groups. This API supports two integration types:

1. **Telegram Mini Apps** - For apps running inside Telegram clients
2. **External Web Applications** - For standalone websites using Telegram Login Widget

## Base URL
```
https://your-bot-domain.com/api/v1
```

## Supported Integration Types

### 🔹 Telegram Mini Apps
Perfect for apps that run directly within Telegram on mobile and desktop. Uses Telegram's native `initData` for seamless authentication.

### 🔹 External Web Applications  
Ideal for standalone websites that want to integrate with Telegram groups. Uses Telegram Login Widget for user authentication.

### 🔹 API-Only Integration
For developers who want to build their own frontend with any technology stack.

## Authentication
All API endpoints (except `/auth/verify`) require Bearer token authentication using JWT tokens obtained from the authentication endpoint.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Quick Start Guide

### For Telegram Mini Apps 🔗
1. Initialize Telegram WebApp
2. Get `initData` from `window.Telegram.WebApp.initData`
3. Send `initData` to `/auth/verify`
4. Use returned JWT token for API calls

### For External Websites 🌐
1. Add Telegram Login Widget to your page
2. Collect user data from widget callback
3. Send user data to `/auth/verify`
4. Use returned JWT token for API calls

### For API-Only Integration ⚙️
1. Implement your own Telegram authentication
2. Generate valid `initData` or user data
3. Verify with `/auth/verify` endpoint
4. Build your frontend with any technology

## Endpoints

### Authentication

#### POST /auth/verify
Verifies Telegram user data and returns a JWT token for subsequent API calls. Supports both Telegram Mini Apps and external apps using Login Widget.

**🔹 For Telegram Mini Apps - Request Body:**
```json
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22johndoe%22%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2"
}
```

**🔹 For External Apps (Login Widget) - Request Body:**
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

**Error Responses:**
- `400 Bad Request`: Authentication data is missing or invalid format
- `401 Unauthorized`: Invalid Telegram data or hash verification failed

---

### Groups Management

#### GET /groups
Returns a list of groups where the authenticated user is an administrator.

**Response:**
```json
[
  {
    "chatId": "-100123456789",
    "chatTitle": "My Awesome Group"
  },
  {
    "chatId": "-100987654321", 
    "chatTitle": "Another Group"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: No valid token provided

---

### Group Settings

#### GET /groups/{groupId}/settings
Retrieves the moderation settings for a specific group.

**Parameters:**
- `groupId` (path): The Telegram group ID (e.g., "-100123456789")

**Response:**
```json
{
  "alertLevel": 1,
  "muteLevel": 2,
  "kickLevel": 3,
  "banLevel": 0,
  "spamThreshold": 0.85,
  "muteDurationMinutes": 60,
  "warningMessage": "⚠️ {user}, please avoid posting promotional/banned content.",
  "warningMessageDeleteSeconds": 15,
  "moderatorIds": ["123456789"],
  "whitelistedKeywords": ["crypto", "bitcoin"],
  "keywordWhitelistBypass": true,
  "strikeExpirationDays": 30,
  "goodBehaviorDays": 7
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not an admin of this group
- `404 Not Found`: Group not found

#### PUT /groups/{groupId}/settings
Updates the moderation settings for a specific group.

**Parameters:**
- `groupId` (path): The Telegram group ID

**Request Body:**
```json
{
  "settings": {
    "alertLevel": 2,
    "muteLevel": 3,
    "spamThreshold": 0.9,
    "muteDurationMinutes": 120
  }
}
```

**Response:**
```json
{
  "message": "Settings updated successfully.",
  "settings": {
    "alertLevel": 2,
    "muteLevel": 3,
    "kickLevel": 3,
    "banLevel": 0,
    // ... complete updated settings object
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid settings object
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not an admin of this group

---

### Group Statistics

#### GET /groups/{groupId}/stats
Retrieves moderation statistics for a specific group.

**Parameters:**
- `groupId` (path): The Telegram group ID

**Response:**
```json
{
  "totalMessagesProcessed": 1250,
  "violationsDetected": 45,
  "actionsTaken": 45,
  "deletionsToday": 8
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User is not an admin of this group
- `404 Not Found`: Group not found

---

## Settings Configuration

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `alertLevel` | integer | 1 | Strikes required to trigger a warning message |
| `muteLevel` | integer | 2 | Strikes required to mute a user |
| `kickLevel` | integer | 3 | Strikes required to kick a user |
| `banLevel` | integer | 0 | Strikes required to ban a user (0 = disabled) |
| `spamThreshold` | float | 0.85 | AI confidence threshold (0.0-1.0) for spam detection |
| `muteDurationMinutes` | integer | 60 | Duration in minutes for user mutes |
| `warningMessage` | string | "⚠️ {user}, please avoid posting promotional/banned content." | Message shown when a user receives a strike |
| `warningMessageDeleteSeconds` | integer | 15 | Seconds before warning message is auto-deleted (0 = never) |
| `moderatorIds` | array | [] | List of user IDs that bypass moderation |
| `whitelistedKeywords` | array | [] | Keywords that bypass AI detection |
| `keywordWhitelistBypass` | boolean | true | Whether whitelisted keywords bypass detection entirely |
| `strikeExpirationDays` | integer | 30 | Days after which strikes automatically expire |
| `goodBehaviorDays` | integer | 7 | Days of good behavior before automatic strike forgiveness |

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Descriptive error message"
}
```

### Common Error Codes
- `400 Bad Request`: Invalid input data or parameters
- `401 Unauthorized`: Authentication required or token invalid
- `403 Forbidden`: Insufficient permissions for the requested action
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error occurred

---

## Integration Examples

## 🔹 Telegram Mini App Integration

### Complete Mini App Setup

**1. HTML Structure (miniapp.html):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moderator Bot Settings</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>
    <div id="app">
        <div id="loading">Loading...</div>
        <div id="content" style="display: none;">
            <h1>Group Settings</h1>
            <div id="groups-list"></div>
            <div id="settings-panel" style="display: none;">
                <!-- Settings form will be populated here -->
            </div>
        </div>
    </div>

    <script>
        // Initialize Telegram Mini App
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        // Set theme colors
        document.body.style.backgroundColor = tg.backgroundColor;
        document.body.style.color = tg.textColor;

        let authToken = null;

        // Authenticate user
        async function authenticate() {
            try {
                const initData = tg.initData;
                
                const response = await fetch('/api/v1/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        initData: initData
                    })
                });

                if (!response.ok) {
                    throw new Error('Authentication failed');
                }

                const data = await response.json();
                authToken = data.token;
                
                // Load groups after authentication
                await loadGroups();
                
            } catch (error) {
                console.error('Auth error:', error);
                document.getElementById('loading').innerHTML = 'Authentication failed';
            }
        }

        // Load user's groups
        async function loadGroups() {
            try {
                const response = await fetch('/api/v1/groups', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                const groups = await response.json();
                displayGroups(groups);
                
                document.getElementById('loading').style.display = 'none';
                document.getElementById('content').style.display = 'block';
                
            } catch (error) {
                console.error('Failed to load groups:', error);
            }
        }

        // Display groups list
        function displayGroups(groups) {
            const groupsList = document.getElementById('groups-list');
            
            groups.forEach(group => {
                const button = document.createElement('button');
                button.textContent = group.chatTitle;
                button.onclick = () => loadGroupSettings(group.chatId);
                groupsList.appendChild(button);
            });
        }

        // Load specific group settings
        async function loadGroupSettings(groupId) {
            try {
                const response = await fetch(`/api/v1/groups/${groupId}/settings`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                const settings = await response.json();
                displaySettings(groupId, settings);
                
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }

        // Display settings form
        function displaySettings(groupId, settings) {
            const panel = document.getElementById('settings-panel');
            panel.innerHTML = `
                <h2>Group Settings</h2>
                <form id="settings-form">
                    <label>Alert Level: <input type="number" name="alertLevel" value="${settings.alertLevel}" min="0" max="10"></label>
                    <label>Mute Level: <input type="number" name="muteLevel" value="${settings.muteLevel}" min="0" max="10"></label>
                    <label>Kick Level: <input type="number" name="kickLevel" value="${settings.kickLevel}" min="0" max="10"></label>
                    <label>Spam Threshold: <input type="number" name="spamThreshold" value="${settings.spamThreshold}" min="0" max="1" step="0.01"></label>
                    <button type="submit">Save Settings</button>
                </form>
            `;
            
            panel.style.display = 'block';
            
            document.getElementById('settings-form').onsubmit = (e) => {
                e.preventDefault();
                saveSettings(groupId, new FormData(e.target));
            };
        }

        // Save settings
        async function saveSettings(groupId, formData) {
            try {
                const settings = {};
                for (let [key, value] of formData) {
                    settings[key] = isNaN(value) ? value : Number(value);
                }

                const response = await fetch(`/api/v1/groups/${groupId}/settings`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ settings })
                });

                if (response.ok) {
                    tg.HapticFeedback.notificationOccurred('success');
                    tg.showAlert('Settings saved successfully!');
                } else {
                    throw new Error('Failed to save settings');
                }
                
            } catch (error) {
                tg.HapticFeedback.notificationOccurred('error');
                tg.showAlert('Failed to save settings');
                console.error('Save error:', error);
            }
        }

        // Start the app
        authenticate();
    </script>
</body>
</html>
```

## 🔹 External Web Application Integration

### Complete External App Setup

**1. HTML Structure (external-app.html):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram Moderator Bot - Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .login-container { text-align: center; padding: 50px; }
        .app-container { display: none; }
        .group-list { margin: 20px 0; }
        .group-item { padding: 10px; margin: 5px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
        .settings-form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .form-group { margin: 10px 0; }
        label { display: block; margin: 5px 0; }
        input, button { padding: 8px; margin: 5px; }
        button { background: #0088cc; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #006699; }
    </style>
</head>
<body>
    <!-- Login Section -->
    <div id="login-container" class="login-container">
        <h1>Telegram Moderator Bot</h1>
        <p>Please log in with your Telegram account to manage your group settings.</p>
        
        <!-- Telegram Login Widget -->
        <script async src="https://telegram.org/js/telegram-widget.js?22" 
                data-telegram-login="YOUR_BOT_USERNAME" 
                data-size="large" 
                data-onauth="onTelegramAuth(user)" 
                data-request-access="write">
        </script>
        
        <p style="margin-top: 20px; color: #666;">
            Note: Replace YOUR_BOT_USERNAME with your actual bot username in the script above.
        </p>
    </div>

    <!-- Main App Section -->
    <div id="app-container" class="app-container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>Your Telegram Groups</h1>
            <button onclick="logout()">Logout</button>
        </div>
        
        <div id="groups-list" class="group-list">
            <p>Loading your groups...</p>
        </div>
        
        <div id="settings-panel" style="display: none;">
            <!-- Settings will be loaded here -->
        </div>
    </div>

    <script>
        let authToken = null;
        let currentUser = null;

        // Telegram Login Widget Callback
        function onTelegramAuth(user) {
            console.log('Telegram auth received:', user);
            authenticateUser(user);
        }

        // Authenticate with the API
        async function authenticateUser(userData) {
            try {
                const response = await fetch('/api/v1/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    throw new Error(`Authentication failed: ${response.status}`);
                }

                const data = await response.json();
                authToken = data.token;
                currentUser = userData;
                
                // Store token for session persistence
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                showApp();
                await loadGroups();
                
            } catch (error) {
                console.error('Authentication error:', error);
                alert('Authentication failed. Please try again.');
            }
        }

        // Show main app interface
        function showApp() {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
        }

        // Load user's groups
        async function loadGroups() {
            try {
                const response = await fetch('/api/v1/groups', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to load groups: ${response.status}`);
                }

                const groups = await response.json();
                displayGroups(groups);
                
            } catch (error) {
                console.error('Failed to load groups:', error);
                document.getElementById('groups-list').innerHTML = 
                    '<p style="color: red;">Failed to load groups. Please refresh the page.</p>';
            }
        }

        // Display groups list
        function displayGroups(groups) {
            const groupsList = document.getElementById('groups-list');
            
            if (groups.length === 0) {
                groupsList.innerHTML = '<p>No groups found. Make sure the bot is added to your groups as an admin.</p>';
                return;
            }

            groupsList.innerHTML = groups.map(group => `
                <div class="group-item" onclick="loadGroupSettings('${group.chatId}', '${group.chatTitle}')">
                    <h3>${group.chatTitle}</h3>
                    <p>Group ID: ${group.chatId}</p>
                </div>
            `).join('');
        }

        // Load group settings
        async function loadGroupSettings(groupId, groupTitle) {
            try {
                const response = await fetch(`/api/v1/groups/${groupId}/settings`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to load settings: ${response.status}`);
                }

                const settings = await response.json();
                displaySettings(groupId, groupTitle, settings);
                
            } catch (error) {
                console.error('Failed to load settings:', error);
                alert('Failed to load group settings.');
            }
        }

        // Display settings form
        function displaySettings(groupId, groupTitle, settings) {
            const panel = document.getElementById('settings-panel');
            panel.innerHTML = `
                <div class="settings-form">
                    <h2>Settings for ${groupTitle}</h2>
                    <form id="settings-form">
                        <div class="form-group">
                            <label>Alert Level (warnings):</label>
                            <input type="number" name="alertLevel" value="${settings.alertLevel}" min="0" max="10">
                        </div>
                        <div class="form-group">
                            <label>Mute Level:</label>
                            <input type="number" name="muteLevel" value="${settings.muteLevel}" min="0" max="10">
                        </div>
                        <div class="form-group">
                            <label>Kick Level:</label>
                            <input type="number" name="kickLevel" value="${settings.kickLevel}" min="0" max="10">
                        </div>
                        <div class="form-group">
                            <label>Ban Level (0 = disabled):</label>
                            <input type="number" name="banLevel" value="${settings.banLevel}" min="0" max="10">
                        </div>
                        <div class="form-group">
                            <label>Spam Detection Threshold (0.0 - 1.0):</label>
                            <input type="number" name="spamThreshold" value="${settings.spamThreshold}" min="0" max="1" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Mute Duration (minutes):</label>
                            <input type="number" name="muteDurationMinutes" value="${settings.muteDurationMinutes}" min="1">
                        </div>
                        <div class="form-group">
                            <label>Warning Message:</label>
                            <input type="text" name="warningMessage" value="${settings.warningMessage}" style="width: 100%;">
                        </div>
                        <button type="submit">Save Settings</button>
                        <button type="button" onclick="hideSettings()">Cancel</button>
                    </form>
                </div>
            `;
            
            panel.style.display = 'block';
            
            document.getElementById('settings-form').onsubmit = (e) => {
                e.preventDefault();
                saveSettings(groupId, new FormData(e.target));
            };
        }

        // Save settings
        async function saveSettings(groupId, formData) {
            try {
                const settings = {};
                for (let [key, value] of formData) {
                    // Convert numbers
                    if (key === 'spamThreshold') {
                        settings[key] = parseFloat(value);
                    } else if (['alertLevel', 'muteLevel', 'kickLevel', 'banLevel', 'muteDurationMinutes'].includes(key)) {
                        settings[key] = parseInt(value);
                    } else {
                        settings[key] = value;
                    }
                }

                const response = await fetch(`/api/v1/groups/${groupId}/settings`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ settings })
                });

                if (!response.ok) {
                    throw new Error(`Failed to save settings: ${response.status}`);
                }

                alert('Settings saved successfully!');
                hideSettings();
                
            } catch (error) {
                console.error('Save error:', error);
                alert('Failed to save settings. Please try again.');
            }
        }

        // Hide settings panel
        function hideSettings() {
            document.getElementById('settings-panel').style.display = 'none';
        }

        // Logout function
        function logout() {
            authToken = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            document.getElementById('login-container').style.display = 'block';
            document.getElementById('app-container').style.display = 'none';
            
            hideSettings();
        }

        // Check for existing session on page load
        window.onload = function() {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('currentUser');
            
            if (storedToken && storedUser) {
                authToken = storedToken;
                currentUser = JSON.parse(storedUser);
                showApp();
                loadGroups();
            }
        };
    </script>
</body>
</html>
```

## 🔹 API-Only Integration Examples

### Node.js/Express Example
```javascript
const express = require('express');
const axios = require('axios');

const API_BASE = 'https://your-bot-domain.com/api/v1';
let authToken = null;

// Authenticate
async function authenticate(telegramUserData) {
    try {
        const response = await axios.post(`${API_BASE}/auth/verify`, telegramUserData);
        authToken = response.data.token;
        return authToken;
    } catch (error) {
        console.error('Authentication failed:', error.response?.data);
        throw error;
    }
}

// Get user's groups
async function getUserGroups() {
    const response = await axios.get(`${API_BASE}/groups`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
}

// Update group settings
async function updateGroupSettings(groupId, settings) {
    const response = await axios.put(`${API_BASE}/groups/${groupId}/settings`, 
        { settings }, 
        { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
}
```

### Python/Flask Example
```python
import requests

API_BASE = 'https://your-bot-domain.com/api/v1'
auth_token = None

def authenticate(telegram_user_data):
    global auth_token
    response = requests.post(f'{API_BASE}/auth/verify', json=telegram_user_data)
    response.raise_for_status()
    auth_token = response.json()['token']
    return auth_token

def get_user_groups():
    headers = {'Authorization': f'Bearer {auth_token}'}
    response = requests.get(f'{API_BASE}/groups', headers=headers)
    response.raise_for_status()
    return response.json()

def update_group_settings(group_id, settings):
    headers = {'Authorization': f'Bearer {auth_token}'}
    data = {'settings': settings}
    response = requests.put(f'{API_BASE}/groups/{group_id}/settings', 
                          json=data, headers=headers)
    response.raise_for_status()
    return response.json()
```

### React.js Example
```javascript
import React, { useState, useEffect } from 'react';

const API_BASE = '/api/v1';

function TelegramModeratorApp() {
    const [authToken, setAuthToken] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Authenticate with Telegram data
    const authenticate = async (telegramData) => {
        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telegramData)
            });
            
            const data = await response.json();
            setAuthToken(data.token);
            loadGroups(data.token);
        } catch (error) {
            console.error('Auth failed:', error);
        }
    };

    // Load user groups
    const loadGroups = async (token) => {
        try {
            const response = await fetch(`${API_BASE}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const groupsData = await response.json();
            setGroups(groupsData);
        } catch (error) {
            console.error('Failed to load groups:', error);
        }
    };

    // Update group settings
    const updateSettings = async (groupId, settings) => {
        try {
            await fetch(`${API_BASE}/groups/${groupId}/settings`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });
            alert('Settings updated!');
        } catch (error) {
            console.error('Failed to update settings:', error);
        }
    };

    return (
        <div>
            {!authToken ? (
                <TelegramLogin onAuth={authenticate} />
            ) : (
                <div>
                    <GroupsList groups={groups} onSelect={setSelectedGroup} />
                    {selectedGroup && (
                        <SettingsPanel 
                            group={selectedGroup} 
                            onUpdate={updateSettings} 
                        />
                    )}
                </div>
            )}
        </div>
    );
}
```

---

## Deployment and Setup

### Bot Setup Requirements

1. **Create Telegram Bot:**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Save your bot token securely

2. **Configure Bot Settings:**
   - Set bot commands with @BotFather
   - Enable inline mode if needed
   - Set bot privacy settings

3. **Environment Variables:**
   ```bash
   BOT_TOKEN=your_telegram_bot_token
   JWT_SECRET=your_jwt_secret_key
   DATABASE_URL=your_database_connection
   PORT=3000
   ```

### Domain Setup for External Apps

1. **HTTPS Required:** Telegram requires HTTPS for Login Widget
2. **Domain Verification:** Add your domain to bot settings via @BotFather
3. **CORS Configuration:** Ensure your API allows cross-origin requests

### Testing Your Integration

#### Test Telegram Mini App:
1. Create a test bot with @BotFather
2. Deploy your Mini App to a web server
3. Set the Mini App URL with @BotFather using `/newapp`
4. Test in Telegram by opening the Mini App

#### Test External Web App:
1. Deploy your web app with HTTPS
2. Update Login Widget script with your bot username
3. Test authentication flow
4. Verify API calls work correctly

---

## Troubleshooting

### Common Issues

**🔧 Authentication Failures:**
- Check that your bot token is correct
- Verify `initData` is being sent properly
- Ensure JWT_SECRET is set correctly
- Check that hash verification is working

**🔧 CORS Errors (External Apps):**
- Add proper CORS headers to your API
- Ensure your domain is whitelisted
- Check that preflight requests are handled

**🔧 Mini App Not Loading:**
- Verify HTTPS is enabled
- Check Web App URL in @BotFather settings
- Ensure `telegram-web-app.js` is loaded correctly
- Check browser console for errors

**🔧 Permission Errors:**
- Verify user is admin of the group
- Check that bot is added to the group
- Ensure bot has admin permissions

### API Response Codes Reference

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid JSON, missing fields, malformed data |
| 401 | Unauthorized | Invalid token, expired token, missing auth |
| 403 | Forbidden | User not admin, bot not in group |
| 404 | Not Found | Group doesn't exist, invalid endpoint |
| 500 | Server Error | Database issues, internal server problems |

---

## Security Best Practices

### For Mini Apps 🔐
- Always use `initData` from `window.Telegram.WebApp.initData`
- Never store sensitive data in browser localStorage
- Implement proper error handling for auth failures
- Use HTTPS for all API endpoints

### For External Apps 🔐
- Validate Login Widget data on your server
- Implement rate limiting for API endpoints
- Use secure HTTP headers (HSTS, CSP, etc.)
- Store JWT tokens securely (httpOnly cookies recommended)

### For API Integration 🔐
- Never expose bot tokens or JWT secrets in frontend code
- Implement proper input validation
- Use parameterized queries for database operations
- Log security events for monitoring

---

## Rate Limiting

The API implements standard rate limiting to prevent abuse:
- 100 requests per minute per user
- 1000 requests per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1678886460
```

---

## CORS Policy

The API allows cross-origin requests from Telegram Mini App contexts:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Authorization, Content-Type`

---

## API Versioning

The API uses URL versioning (`/api/v1/`). Future versions will be released as `/api/v2/` etc., with backwards compatibility maintained for previous versions.
