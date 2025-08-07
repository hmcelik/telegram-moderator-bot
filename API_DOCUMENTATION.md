# Telegram Moderator Bot - API Documentation

This documentation provides comprehensive information about all available API endpoints for the Telegram Moderator Bot. The API follows RESTful principles and supports **unified authentication** for maximum flexibility.

## Base Information

- **Base URL**: `http://localhost:3000/api/v1`
- **API Version**: 2.0.0
- **Authentication**: Unified Authentication (JWT Bearer Token + Telegram WebApp)
- **Content Type**: `application/json`

## Interactive Documentation

The complete interactive API documentation is available at:
**http://localhost:3000/api/docs**

## Authentication

The API supports **unified authentication** - the same endpoints work with both authentication methods:

### Authentication Methods
1. **JWT Bearer Token**: For external websites and applications
2. **Telegram WebApp initData**: For Telegram Mini Apps

### Unified Authentication Flow
The API automatically detects and validates both authentication methods on the same endpoints:

**Option 1 - JWT Bearer Token:**
```http
Authorization: Bearer <jwt_token>
```

**Option 2 - Telegram WebApp:**
```http
X-Telegram-Init-Data: <telegram_webapp_initdata>
```

### Legacy Authentication Endpoints
For obtaining JWT tokens, use these dedicated endpoints:

---

## Endpoints Overview

### 🔐 Authentication Endpoints

#### POST `/auth/verify`
**Universal Telegram Authentication**

Supports both Telegram Login Widget and Mini App authentication methods.

**Request Body Options:**

*Login Widget Data:*
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
  "auth_date": 1678886400,
  "hash": "authentication_hash_from_telegram"
}
```

*Mini App Data:*
```json
{
  "initData": "raw_init_data_string_from_telegram_mini_app"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
    "auth_date": 1678886400
  }
}
```

#### POST `/auth/login-widget`
**Dedicated Login Widget Authentication**

Specialized endpoint for external websites using Telegram Login Widget.

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
  "auth_date": 1678886400,
  "hash": "authentication_hash_from_telegram"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_for_api_access",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/johndoe.jpg"
  }
}
```

#### POST `/auth/refresh`
**Refresh JWT Token**

Extends the validity of an existing JWT token.

**Headers:**
```
Authorization: Bearer <current_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token",
    "expiresAt": "2024-03-25T10:30:00Z"
  }
}
```

#### GET `/auth/verify-token`
**Verify JWT Token**

Validates the current JWT token and returns user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "valid": true,
    "user": {
      "id": 123456789,
      "first_name": "John",
      "username": "johndoe"
    },
    "expiresAt": "2024-03-25T10:30:00Z"
  }
}
```

---

### 👥 Unified Group Management Endpoints

The unified group API supports both JWT and WebApp authentication on the same endpoints, providing maximum flexibility for different client types.

#### GET `/groups`
**List User's Groups**

Returns all groups where the authenticated user has admin privileges.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Headers:**
```http
# Option 1: JWT
Authorization: Bearer <token>

# Option 2: WebApp  
X-Telegram-Init-Data: <telegram_webapp_initdata>
```

**Response:**
```json
{
  "success": true,
  "message": "Groups retrieved successfully",
  "data": [
    {
      "id": "-1001234567890",
      "title": "My Telegram Group",
      "type": "supergroup",
      "memberCount": 150,
      "settings": {
        "autoModeration": true,
        "maxStrikes": 3
      },
      "stats": {
        "totalMessages": 1250,
        "flaggedToday": 8,
        "activeStrikes": 12
      }
    }
  ]
}
```

#### GET `/groups/{groupId}/settings`
**Get Group Settings**

Retrieves comprehensive moderation settings for a specific group.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID (e.g., "-1001234567890")

**Response:**
```json
{
  "success": true,
  "message": "Group settings retrieved successfully",
  "data": {
    "groupId": "-1001234567890",
    "groupInfo": {
      "title": "My Telegram Group",
      "type": "supergroup",
      "memberCount": 150
    },
    "settings": {
      "alertLevel": 1,
      "muteLevel": 2,
      "kickLevel": 3,
      "banLevel": 0,
      "spamThreshold": 0.85,
      "profanityThreshold": 0.8,
      "muteDurationMinutes": 60,
      "strikeExpirationDays": 30,
      "goodBehaviorDays": 7,
      "warningMessage": "Please follow group rules",
      "warningMessageDeleteSeconds": 30,
      "keywordWhitelistBypass": false,
      "whitelistedKeywords": ["announcement", "important"]
    }
  }
}
```

#### PUT `/groups/{groupId}/settings`
**Update Group Settings**

Updates moderation settings for a specific group with comprehensive validation.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID

**Request Body:**
```json
{
  "settings": {
    "alertLevel": 1,
    "muteLevel": 2,
    "kickLevel": 3,
    "banLevel": 5,
    "spamThreshold": 0.8,
    "profanityThreshold": 0.75,
    "muteDurationMinutes": 120,
    "strikeExpirationDays": 30,
    "goodBehaviorDays": 7,
    "warningMessage": "Updated warning message",
    "warningMessageDeleteSeconds": 45,
    "keywordWhitelistBypass": true,
    "whitelistedKeywords": ["announcement", "important", "update"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Group settings updated successfully",
  "data": {
    "groupId": "-1001234567890",
    "updatedFields": ["muteLevel", "spamThreshold", "whitelistedKeywords"],
    "settings": {
      // Updated settings object
    }
  }
}
```

#### GET `/groups/{groupId}/stats`
**Get Enhanced Group Statistics**

Retrieves comprehensive moderation statistics and analytics for a group.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `period` (query, optional) - Time period: `day`, `week`, `month`, `year` (default: `week`)

**Response:**
```json
{
  "success": true,
  "message": "Group statistics retrieved successfully", 
  "data": {
    "groupId": "-1001234567890",
    "period": "week",
    "dateRange": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-07T23:59:59.000Z"
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

---

### ⚡ Unified Strike Management Endpoints

All strike management endpoints support both JWT and WebApp authentication methods.

#### GET `/groups/{groupId}/users/{userId}/strikes`
**Get User's Strike History**

Retrieves detailed strike information and history for a specific user.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `userId` (path) - User ID
- `limit` (query, optional) - Number of history entries (1-100, default: 50)
- `offset` (query, optional) - Number of entries to skip (default: 0)
- `includeHistory` (query, optional) - Include detailed history (true/false, default: true)

**Response:**
```json
{
  "success": true,
  "message": "Strike history retrieved successfully",
  "data": {
    "userId": "123456789",
    "groupId": "-100123456789",
    "currentStrikes": 2,
    "lastStrikeTimestamp": "2025-08-07T15:30:00.000Z",
    "history": [
      {
        "id": 1,
        "timestamp": "2025-08-07T15:30:00Z",
        "type": "ADD",
        "action": "strike_added",
        "amount": 1,
        "reason": "Spam posting",
        "admin": {
          "id": "987654321",
          "firstName": "Admin",
          "username": "adminuser"
        },
        "violationType": "SPAM",
        "spamScore": 0.92,
        "profanityScore": 0.1
      }
    ]
  }
}
```

#### POST `/groups/{groupId}/users/{userId}/strikes`
**Add Strikes to User**

Manually adds strikes to a user's record.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `userId` (path) - User ID

**Request Body:**
```json
{
  "amount": 2,
  "reason": "Repeated spam posting despite warnings"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Strikes added successfully",
  "data": {
    "newStrikeCount": 4,
    "strikesAdded": 2,
    "previousCount": 2
  }
}
```

#### DELETE `/groups/{groupId}/users/{userId}/strikes`
**Remove Strikes from User**

Removes strikes from a user's record.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `userId` (path) - User ID

**Request Body:**
```json
{
  "amount": 1,
  "reason": "Appeal accepted - false positive detection"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Strikes removed successfully",
  "data": {
    "newStrikeCount": 1,
    "strikesRemoved": 1,
    "previousCount": 2
  }
}
```

#### PUT `/groups/{groupId}/users/{userId}/strikes`
**Set User's Strike Count**

Sets an exact strike count for a user.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `userId` (path) - User ID

**Request Body:**
```json
{
  "count": 0,
  "reason": "Manual reset after review"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Strike count updated successfully",
  "data": {
    "newStrikeCount": 0,
    "previousCount": 3
  }
}
```

---

### 📋 Unified Audit Log Endpoints

Comprehensive audit logging with enhanced filtering and export capabilities.

#### GET `/groups/{groupId}/audit`
**Get Paginated Audit Log**

Retrieves paginated audit log entries for a group with advanced filtering.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `page` (query, optional) - Page number (default: 1)
- `limit` (query, optional) - Entries per page (1-100, default: 50)
- `type` (query, optional) - Filter by action type (e.g., VIOLATION, PENALTY, SCANNED)
- `userId` (query, optional) - Filter by user ID

**Response:**
```json
{
  "success": true,
  "message": "Audit log retrieved successfully",
  "data": {
    "entries": [
      {
        "id": 1,
        "timestamp": "2025-08-07T14:30:00Z",
        "userId": "123456789",
        "chatId": "-1001234567890",
        "type": "VIOLATION",
        "action": "message_flagged",
        "details": {
          "violationType": "SPAM",
          "spamScore": 0.92,
          "reason": "Promotional content detected",
          "messageText": "Buy now! Limited offer!",
          "adminId": "987654321"
        }
      },
      {
        "id": 2,
        "timestamp": "2025-08-07T14:25:00Z",
        "userId": "123456789", 
        "chatId": "-1001234567890",
        "type": "PENALTY",
        "action": "user_muted",
        "details": {
          "duration": 3600,
          "reason": "Strike limit reached",
          "adminId": "987654321"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalEntries": 500,
      "hasNext": true,
      "hasPrev": false,
      "limit": 50,
      "offset": 0
    }
  }
}
```

#### GET `/groups/{groupId}/audit/export`
**Export Audit Log**

Exports audit log in CSV or JSON format with date filtering.

**Authentication**: JWT Bearer Token OR Telegram WebApp initData
**Parameters:**
- `groupId` (path) - Group ID
- `format` (query) - Export format: `csv` or `json` (default: `json`)
- `startDate` (query, optional) - Start date (ISO 8601 format)
- `endDate` (query, optional) - End date (ISO 8601 format)

**Response:**
For JSON format:
```json
{
  "success": true,
  "message": "Audit log exported successfully",
  "data": {
    "total": 1250,
    "dateRange": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-07T23:59:59.000Z"
    },
    "entries": [
      {
        "id": 1,
        "timestamp": "2025-08-07T14:30:00Z",
        "userId": "123456789",
        "chatId": "-1001234567890",
        "type": "VIOLATION",
        "action": "message_flagged",
        "violationType": "SPAM",
        "spamScore": 0.92,
        "profanityScore": null,
        "reason": "Promotional content",
        "adminId": "987654321",
        "amount": null
      }
    ]
  }
}
```

For CSV format:
Returns file download with `Content-Type: text/csv` and appropriate filename.

---

### 🤖 NLP Processing Endpoints

#### GET `/nlp/status`
**NLP Service Status**

Returns the current status of the NLP processing service.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "models": {
      "spam": "loaded",
      "profanity": "loaded"
    },
    "lastUpdate": "2024-03-20T10:00:00Z"
  }
}
```

#### POST `/nlp/test/spam`
**Test Spam Detection**

Tests the spam detection model with provided text.

**Request Body:**
```json
{
  "text": "Buy now! Limited time offer!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Buy now! Limited time offer!",
    "spamScore": 0.92,
    "isSpam": true,
    "confidence": "high"
  }
}
```

#### POST `/nlp/test/profanity`
**Test Profanity Detection**

Tests the profanity detection model with provided text.

**Request Body:**
```json
{
  "text": "Sample text to analyze"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Sample text to analyze",
    "profanityScore": 0.1,
    "hasProfanity": false,
    "confidence": "high"
  }
}
```

#### POST `/nlp/analyze`
**Complete Message Analysis**

Performs comprehensive analysis of a message including spam and profanity detection.

**Request Body:**
```json
{
  "text": "Message to analyze",
  "metadata": {
    "userId": "123456789",
    "groupId": "-1001234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Message to analyze",
    "analysis": {
      "spamScore": 0.2,
      "profanityScore": 0.1,
      "isSpam": false,
      "hasProfanity": false,
      "overallRisk": "low"
    },
    "recommendation": {
      "action": "allow",
      "confidence": 0.95
    }
  }
}
```

---

### 📱 WebApp Endpoints (Telegram Mini Apps)

#### POST `/webapp/auth`
**WebApp Authentication**

Authenticates Telegram Mini App users using initData.

**Request Body:**
```json
{
  "initData": "telegram_webapp_init_data_string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "language_code": "en"
  }
}
```

#### GET `/webapp/user/profile`
**Get User Profile**

Returns the authenticated user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
    "language_code": "en"
  }
}
```

#### GET `/webapp/user/groups`
**Get User's Groups**

Returns groups where the user has admin privileges (WebApp version).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "-1001234567890",
      "title": "My Group",
      "type": "supergroup",
      "memberCount": 150,
      "settings": {
        "autoModeration": true,
        "maxStrikes": 3
      }
    }
  ]
}
```

---

### 🔧 System Endpoints

#### GET `/`
**API Information**

Returns basic information about the API.

**Response:**
```json
{
  "name": "Telegram Moderator Bot API",
  "version": "2.0.0",
  "status": "online",
  "documentation": "/api/docs",
  "uptime": 3600
}
```

#### GET `/health`
**Health Check**

Returns the health status of the API service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-20T14:30:00Z",
  "services": {
    "database": "connected",
    "nlp": "running",
    "telegram": "connected"
  }
}
```

---

## Error Handling

All endpoints return structured error responses:

### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "timestamp": "2024-03-20T14:30:00Z"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request data |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Rate limit headers** are included in responses

---

## Security

### JWT Token Security
- Tokens expire after 24 hours
- Tokens can be refreshed using `/auth/refresh`
- Include tokens in Authorization header: `Bearer <token>`

### CORS Policy
- Configured for Telegram Mini Apps and external websites
- Supports credentials and common headers
- Includes ngrok support for development

### Input Validation
- All inputs are validated using express-validator
- SQL injection protection through parameterized queries
- XSS protection through input sanitization

---

## Development

### Local Testing
1. Start the API server: `npm run dev:api`
2. Access documentation: `http://localhost:3000/api/docs`
3. Test endpoints using the interactive Swagger UI

### Environment Variables
Required environment variables for API functionality:
- `BOT_TOKEN` - Telegram bot token
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - SQLite database path
- `NODE_ENV` - Environment (development/production)

---

*Last Updated: Generated from JSDoc comments - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
