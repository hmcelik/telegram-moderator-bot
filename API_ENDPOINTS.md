# Telegram Moderator Bot API Endpoints

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [WebApp Endpoints](#webapp-endpoints)
4. [Analytics Endpoints](#analytics-endpoints)
5. [Groups Management](#groups-management)
6. [Strike System](#strike-system)
7. [Error Responses](#error-responses)
8. [Data Schemas](#data-schemas)

## Overview

The Telegram Moderator Bot provides a comprehensive REST API for managing group moderation, user analytics, and administrative functions. The API is built on OpenAPI 3.0 specification and provides both JWT-based authentication for web apps and Telegram authentication for native integrations.

**Base URL**: `/api/v1`
**Version**: 2.0.0

## Authentication

The API supports two authentication methods:

### JWT Bearer Authentication
For web applications and external integrations:
```
Authorization: Bearer <jwt_token>
```

### Telegram WebApp Authentication
For Telegram WebApp integrations:
```
Authorization: <telegram_initData>
```

## WebApp Endpoints

### POST `/webapp/auth`
**Authenticate Telegram WebApp user**

Validates Telegram WebApp initData and returns JWT token for API access.

**Security**: Telegram WebApp authentication required
**Content-Type**: `application/json`

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "en"
    }
  }
}
```

## Analytics Endpoints

### GET `/webapp/group/{groupId}/stats`
**Get enhanced group moderation statistics**

Retrieves comprehensive moderation statistics including message analysis, user penalties, and quality metrics.

**Parameters**:
- `groupId` (path, required): Group identifier
- `period` (query, optional): Time period (`day`, `week`, `month`, `year`) - default: `week`

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "groupId": "-100123456789",
    "period": "week",
    "dateRange": {
      "start": "2024-01-15T00:00:00.000Z",
      "end": "2024-01-22T00:00:00.000Z"
    },
    "stats": {
      "totalMessages": 15420,
      "flaggedMessages": {
        "total": 342,
        "spam": 289,
        "profanity": 53
      },
      "deletedMessages": 298,
      "penalties": {
        "mutedUsers": 42,
        "kickedUsers": 18,
        "bannedUsers": 7,
        "totalUsersActioned": 58
      },
      "qualityMetrics": {
        "averageSpamScore": 0.73,
        "flaggedRate": 2.22,
        "moderationEfficiency": {
          "messagesScanned": 15420,
          "violationsDetected": 342,
          "usersActioned": 58
        }
      },
      "topViolationTypes": [
        { "type": "SPAM", "count": 289 },
        { "type": "PROFANITY", "count": 53 }
      ]
    }
  }
}
```

### GET `/webapp/group/{groupId}/users`
**Get detailed user activity statistics**

Retrieves user activity statistics including violation rates and penalty history for group members.

**Parameters**:
- `groupId` (path, required): Group identifier
- `period` (query, optional): Time period (`day`, `week`, `month`, `year`) - default: `week`
- `limit` (query, optional): Maximum users to return (1-100) - default: `10`

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "groupId": "-100123456789",
    "period": "week",
    "dateRange": {
      "start": "2024-01-15T00:00:00.000Z",
      "end": "2024-01-22T00:00:00.000Z"
    },
    "users": [
      {
        "userId": "987654321",
        "username": "problematicuser",
        "firstName": "Problem",
        "lastName": "User",
        "stats": {
          "messagesSent": 256,
          "violations": 12,
          "penalties": 3,
          "averageSpamScore": 0.82,
          "violationRate": 4.69
        }
      }
    ]
  }
}
```

### GET `/webapp/group/{groupId}/patterns`
**Get activity patterns for a group**

Analyzes time-based activity patterns including hourly distribution and daily activity trends.

**Parameters**:
- `groupId` (path, required): Group identifier
- `period` (query, optional): Time period (`day`, `week`, `month`, `year`) - default: `week`

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "groupId": "-100123456789",
    "period": "week",
    "patterns": {
      "hourlyDistribution": [
        {
          "hour": 0,
          "messages": 127,
          "violations": 8,
          "violationRate": 6.30
        },
        {
          "hour": 1,
          "messages": 89,
          "violations": 3,
          "violationRate": 3.37
        }
      ],
      "dailyActivity": [
        {
          "date": "2024-01-15",
          "messages": 2341,
          "violations": 45,
          "violationRate": 1.92
        }
      ]
    }
  }
}
```

### GET `/webapp/group/{groupId}/effectiveness`
**Get moderation effectiveness metrics**

Provides comprehensive metrics to evaluate moderation system performance including response times and repeat offender analysis.

**Parameters**:
- `groupId` (path, required): Group identifier
- `period` (query, optional): Time period (`day`, `week`, `month`, `year`) - default: `week`

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "groupId": "-100123456789",
    "period": "week",
    "effectiveness": {
      "averageResponseTimeSeconds": 2.3,
      "effectivenessScore": 87,
      "totalRepeatOffenders": 12,
      "responseTimeDistribution": [
        {
          "violationType": "SPAM",
          "penaltyAction": "MUTE",
          "responseTimeSeconds": 1.8
        }
      ],
      "topRepeatOffenders": [
        {
          "userId": "987654321",
          "totalViolations": 23,
          "activeDays": 5,
          "averageViolationScore": 0.89
        }
      ]
    }
  }
}
```

## Groups Management

### GET `/groups`
**List groups the user is an admin of**

Returns all Telegram groups where the authenticated user has administrative privileges.

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": [
    {
      "chatId": "-100123456789",
      "chatTitle": "Telegram Moderation Group"
    },
    {
      "chatId": "-100987654321",
      "chatTitle": "Another Moderated Group"
    }
  ]
}
```

### GET `/groups/{groupId}/settings`
**Get group settings**

Retrieves the current moderation settings for a specific group.

**Parameters**:
- `groupId` (path, required): Group identifier

**Security**: JWT Bearer token required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "alertLevel": 1,
    "muteLevel": 2,
    "kickLevel": 3,
    "banLevel": 0,
    "spamThreshold": 0.85,
    "profanityEnabled": true,
    "profanityThreshold": 0.8
  }
}
```

### PUT `/groups/{groupId}/settings`
**Update group settings**

Updates moderation settings for a specific group. User must be a group administrator.

**Parameters**:
- `groupId` (path, required): Group identifier

**Request Body**:
```json
{
  "settings": {
    "alertLevel": 1,
    "muteLevel": 2,
    "kickLevel": 3,
    "banLevel": 5,
    "spamThreshold": 0.8,
    "profanityEnabled": true,
    "profanityThreshold": 0.75
  }
}
```

**Security**: JWT Bearer token required

**Response**:
```json
{
  "success": true,
  "message": "Group settings updated successfully"
}
```

## Strike System

### GET `/groups/{groupId}/users/{userId}/strikes`
**Get user's detailed strike history**

Retrieves comprehensive strike information and history for a specific user in a group.

**Parameters**:
- `groupId` (path, required): Group identifier
- `userId` (path, required): User identifier
- `limit` (query, optional): Number of history entries (1-100) - default: `50`
- `offset` (query, optional): Number of entries to skip - default: `0`
- `includeHistory` (query, optional): Include detailed strike history - default: `false`

**Security**: JWT Bearer token or Telegram WebApp authentication required

**Response Example**:
```json
{
  "success": true,
  "data": {
    "userId": "123456789",
    "groupId": "-100123456789",
    "currentStrikes": 2,
    "lastStrikeTimestamp": "2024-01-20T15:30:00.000Z",
    "history": [
      {
        "id": 1,
        "amount": 1,
        "reason": "Spam detection",
        "timestamp": "2024-01-20T15:30:00.000Z",
        "adminId": "987654321"
      }
    ]
  }
}
```

### POST `/groups/{groupId}/users/{userId}/strikes`
**Add strikes to a user**

Manually adds strikes to a user account. Requires group administrator privileges.

**Parameters**:
- `groupId` (path, required): Group identifier
- `userId` (path, required): User identifier

**Request Body**:
```json
{
  "amount": 2,
  "reason": "Manual moderation action - spam posting"
}
```

**Security**: JWT Bearer token or Telegram WebApp authentication required

**Response**:
```json
{
  "success": true,
  "message": "Strikes added successfully",
  "data": {
    "newStrikeCount": 4,
    "strikesAdded": 2
  }
}
```

### DELETE `/groups/{groupId}/users/{userId}/strikes`
**Remove strikes from a user**

Removes strikes from a user account. Requires group administrator privileges.

**Parameters**:
- `groupId` (path, required): Group identifier  
- `userId` (path, required): User identifier

**Request Body**:
```json
{
  "amount": 1,
  "reason": "Appeal approved - false positive"
}
```

**Security**: JWT Bearer token or Telegram WebApp authentication required

**Response**:
```json
{
  "success": true,
  "message": "Strikes removed successfully",
  "data": {
    "newStrikeCount": 1,
    "strikesRemoved": 1
  }
}
```

### PUT `/groups/{groupId}/users/{userId}/strikes`
**Set user's strike count**

Sets the exact number of strikes for a user. Requires group administrator privileges.

**Parameters**:
- `groupId` (path, required): Group identifier
- `userId` (path, required): User identifier

**Request Body**:
```json
{
  "count": 3,
  "reason": "Manual adjustment after review"
}
```

**Security**: JWT Bearer token or Telegram WebApp authentication required

**Response**:
```json
{
  "success": true,
  "message": "Strike count updated successfully",
  "data": {
    "newStrikeCount": 3,
    "previousCount": 2
  }
}
```

## Authentication Endpoints

### POST `/auth/verify`
**Verify Telegram Login and Get JWT**

Validates Telegram Login Widget authentication data and returns JWT token for API access.

**Request Body**:
```json
{
  "id": 123456789,
  "first_name": "John",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
  "auth_date": 1678886400,
  "hash": "authentication_hash_from_telegram"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Error Responses

All API endpoints return standardized error responses with appropriate HTTP status codes:

### 400 Bad Request
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Invalid request parameters",
    "statusCode": 400
  }
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied - insufficient permissions",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "statusCode": 404
  }
}
```

## Data Schemas

### Group Settings Schema
```json
{
  "alertLevel": {
    "type": "integer",
    "default": 1,
    "description": "Strikes for an AI-detected violation"
  },
  "muteLevel": {
    "type": "integer",
    "default": 2,
    "description": "Strikes required to mute a user"
  },
  "kickLevel": {
    "type": "integer",
    "default": 3,
    "description": "Strikes required to kick a user"
  },
  "banLevel": {
    "type": "integer",
    "default": 0,
    "description": "Strikes required to ban a user (0 means disabled)"
  },
  "spamThreshold": {
    "type": "number",
    "default": 0.85,
    "description": "AI confidence level to trigger a violation"
  },
  "profanityEnabled": {
    "type": "boolean",
    "default": true,
    "description": "Enable profanity detection"
  },
  "profanityThreshold": {
    "type": "number",
    "default": 0.8,
    "description": "Profanity detection threshold"
  }
}
```

### Enhanced Group Stats Schema
The enhanced statistics provide comprehensive insights into group moderation activity:

- **Total Messages**: Count of all messages processed by the bot
- **Flagged Messages**: Breakdown of spam vs profanity violations
- **Deleted Messages**: Messages automatically removed by the system
- **Penalties**: User actions taken (mutes, kicks, bans)
- **Quality Metrics**: Performance indicators and efficiency scores
- **Top Violation Types**: Most common violation categories

### User Activity Stats Schema
Individual user performance metrics including:

- **Messages Sent**: Total message count
- **Violations**: Number of rule violations
- **Penalties**: Punitive actions received
- **Average Spam Score**: Mean confidence level of flagged content
- **Violation Rate**: Percentage of messages that violated rules

### Activity Patterns Schema
Time-based analysis including:

- **Hourly Distribution**: 24-hour activity breakdown
- **Daily Activity**: Day-by-day trends
- **Violation Rates**: Time-based violation frequency

### Moderation Effectiveness Schema
Performance evaluation metrics:

- **Response Time**: Average time to handle violations
- **Effectiveness Score**: Overall performance rating (0-100)
- **Repeat Offenders**: Users with multiple violations
- **Response Distribution**: Breakdown by violation and penalty type

## Usage Examples

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

// Authenticate and get JWT token
const authResponse = await axios.post('/api/v1/webapp/auth', {
  // Telegram WebApp initData
}, {
  headers: {
    'Authorization': telegramInitData
  }
});

const token = authResponse.data.data.token;

// Get group statistics
const statsResponse = await axios.get('/api/v1/webapp/group/-100123456789/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    period: 'week'
  }
});

console.log(statsResponse.data.data.stats);
```

### Python Example
```python
import requests

# Authentication
auth_response = requests.post('/api/v1/webapp/auth', 
    headers={'Authorization': telegram_init_data})
token = auth_response.json()['data']['token']

# Get user activity statistics
headers = {'Authorization': f'Bearer {token}'}
params = {'period': 'month', 'limit': 20}

users_response = requests.get('/api/v1/webapp/group/-100123456789/users', 
    headers=headers, params=params)

users_data = users_response.json()['data']['users']
for user in users_data:
    print(f"User: {user['username']}, Violation Rate: {user['stats']['violationRate']}%")
```

---

## Notes

- All timestamps are returned in ISO 8601 format (UTC)
- Rate limiting may apply to prevent abuse
- Administrative privileges are required for modifying group settings and user strikes
- The enhanced analytics system maintains backward compatibility with legacy data
- All endpoints support CORS for web application integration
- API documentation is also available at `http://localhost:3000/api/docs/` when the server is running

This API documentation serves as a comprehensive reference for integrating with the Telegram Moderator Bot system and can be easily transferred between projects.
