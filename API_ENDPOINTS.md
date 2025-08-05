# API Endpoints Documentation

## Telegram Moderator Bot API

**Base URL:** `https://minnow-good-mostly.ngrok-free.app` (or your current ngrok URL)
**Version:** 1.0.0

---

## Table of Contents

1. [Health & Status Endpoints](#health--status-endpoints)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Group Management Endpoints](#group-management-endpoints)
4. [WebApp Endpoints](#webapp-endpoints)
5. [NLP (Natural Language Processing) Endpoints](#nlp-natural-language-processing-endpoints)
6. [Common Headers](#common-headers)
7. [Error Responses](#error-responses)

---

## Health & Status Endpoints

### 1. Global Health Check

**Endpoint:** `GET /api/v1/health`
**Authentication:** None required
**Description:** Check if the API server is running and healthy

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/health" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-04T22:07:47.248Z",
  "service": "telegram-moderator-bot-api",
  "version": "1.0.0"
}
```

### 2. Root API Information

**Endpoint:** `GET /`
**Authentication:** None required
**Description:** Get API information and available endpoints

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "name": "Telegram Moderator Bot API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-08-04T22:02:23.920Z",
  "endpoints": {
    "health": "/api/v1/health",
    "docs": "/api/docs",
    "auth": "/api/v1/auth",
    "groups": "/api/v1/groups",
    "webapp": "/api/v1/webapp",
    "nlp": "/api/v1/nlp"
  },
  "documentation": "https://minnow-good-mostly.ngrok-free.app/api/docs"
}
```

### 3. WebApp Health Check

**Endpoint:** `GET /api/v1/webapp/health`
**Authentication:** None required
**Description:** Check WebApp-specific health and features

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/health" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "features": {
      "webAppSupport": true,
      "cors": true,
      "rateLimit": true,
      "authentication": true,
      "swagger": true
    }
  },
  "message": "Service is healthy"
}
```

---

## Authentication Endpoints

### 1. Telegram Login Widget Authentication

**Endpoint:** `POST /api/v1/auth/login-widget`
**Authentication:** Telegram Login Widget data
**Description:** Authenticate using Telegram Login Widget for external websites

#### Example Request:
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/auth/login-widget" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
    "auth_date": 1691234567,
    "hash": "telegram_generated_hash"
  }'
```

#### Example Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/johndoe.jpg"
  }
}
```

### 2. General Telegram Authentication

**Endpoint:** `POST /api/v1/auth/verify`
**Authentication:** Telegram auth data (Login Widget or Mini App)
**Description:** Universal authentication endpoint supporting both Login Widget and Mini App

#### Example Request (Mini App):
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/auth/verify" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "initData": "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%7D&auth_date=1691234567&hash=telegram_hash"
  }'
```

#### Example Response:
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Group Management Endpoints

### 1. List User's Admin Groups

**Endpoint:** `GET /api/v1/groups`
**Authentication:** Bearer JWT token required
**Description:** Get all groups where the authenticated user is an administrator

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/groups" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
[
  {
    "id": "-1001234567890",
    "title": "My Awesome Group",
    "type": "supergroup",
    "member_count": 150
  },
  {
    "id": "-1001234567891",
    "title": "Another Group",
    "type": "group",
    "member_count": 45
  }
]
```

### 2. Get Group Settings

**Endpoint:** `GET /api/v1/groups/{groupId}/settings`
**Authentication:** Bearer JWT token + Group admin verification
**Description:** Get moderation settings for a specific group

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/groups/-1001234567890/settings" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "alertLevel": 0.6,
  "muteLevel": 0.7,
  "kickLevel": 0.8,
  "banLevel": 0.9,
  "spamThreshold": 0.7,
  "muteDurationMinutes": 60,
  "warningMessage": "Please follow the group rules.",
  "warningMessageDeleteSeconds": 30,
  "keywordWhitelistBypass": true,
  "strikeExpirationDays": 7,
  "goodBehaviorDays": 30,
  "whitelistedKeywords": ["approved", "verified", "official"]
}
```

### 3. Update Group Settings

**Endpoint:** `PUT /api/v1/groups/{groupId}/settings`
**Authentication:** Bearer JWT token + Group admin verification
**Description:** Update moderation settings for a specific group

#### Example Request:
```bash
curl -X PUT "https://minnow-good-mostly.ngrok-free.app/api/v1/groups/-1001234567890/settings" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "settings": {
      "spamThreshold": 0.8,
      "muteDurationMinutes": 120,
      "warningMessage": "Updated warning message"
    }
  }'
```

#### Example Response:
```json
{
  "message": "Settings updated successfully.",
  "settings": {
    "alertLevel": 0.6,
    "muteLevel": 0.7,
    "kickLevel": 0.8,
    "banLevel": 0.9,
    "spamThreshold": 0.8,
    "muteDurationMinutes": 120,
    "warningMessage": "Updated warning message",
    "warningMessageDeleteSeconds": 30,
    "keywordWhitelistBypass": true,
    "strikeExpirationDays": 7,
    "goodBehaviorDays": 30,
    "whitelistedKeywords": ["approved", "verified", "official"]
  }
}
```

### 4. Get Group Statistics

**Endpoint:** `GET /api/v1/groups/{groupId}/stats`
**Authentication:** Bearer JWT token + Group admin verification
**Description:** Get moderation statistics for a specific group

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/groups/-1001234567890/stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "totalMessagesProcessed": 1250,
  "violationsDetected": 45,
  "actionsTaken": 45,
  "deletionsToday": 12
}
```

---

## WebApp Endpoints

### 1. WebApp Authentication

**Endpoint:** `POST /api/v1/webapp/auth`
**Authentication:** X-Telegram-Init-Data header
**Description:** Authenticate Telegram WebApp user and return JWT token

#### Example Request:
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/auth" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123456789,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "language_code": "en"
    }
  },
  "message": "Authentication successful"
}
```

### 2. Get User Profile

**Endpoint:** `GET /api/v1/webapp/user/profile`
**Authentication:** X-Telegram-Init-Data header
**Description:** Get current user's profile information

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/user/profile" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "language_code": "en",
    "admin_groups": [
      {
        "id": "-1001234567890",
        "title": "My Awesome Group",
        "type": "supergroup"
      }
    ]
  },
  "message": "Profile retrieved successfully"
}
```

### 3. Get User's Groups (WebApp)

**Endpoint:** `GET /api/v1/webapp/user/groups`
**Authentication:** X-Telegram-Init-Data header
**Description:** Get list of groups where user is admin (WebApp version)

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/user/groups" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "-1001234567890",
      "title": "My Awesome Group",
      "type": "supergroup",
      "member_count": 150
    },
    {
      "id": "-1001234567891",
      "title": "Another Group",
      "type": "group", 
      "member_count": 45
    }
  ],
  "message": "User groups retrieved successfully"
}
```

### 4. Get Group Settings (WebApp)

**Endpoint:** `GET /api/v1/webapp/group/{groupId}/settings`
**Authentication:** X-Telegram-Init-Data header + Group admin verification
**Description:** Get group settings via WebApp

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/group/-1001234567890/settings" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "settings": {
      "alertLevel": 0.6,
      "muteLevel": 0.7,
      "kickLevel": 0.8,
      "banLevel": 0.9,
      "spamThreshold": 0.7,
      "muteDurationMinutes": 60,
      "warningMessage": "Please follow the group rules.",
      "warningMessageDeleteSeconds": 30,
      "keywordWhitelistBypass": true,
      "strikeExpirationDays": 7,
      "goodBehaviorDays": 30,
      "whitelistedKeywords": ["approved", "verified", "official"]
    }
  }
}
```

### 5. Update Group Settings (WebApp)

**Endpoint:** `PUT /api/v1/webapp/group/{groupId}/settings`
**Authentication:** X-Telegram-Init-Data header + Group admin verification
**Description:** Update group settings via WebApp

#### Example Request:
```bash
curl -X PUT "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/group/-1001234567890/settings" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "settings": {
      "spamThreshold": 0.8,
      "muteDurationMinutes": 120
    }
  }'
```

#### Example Response:
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### 6. Get Group Statistics (WebApp)

**Endpoint:** `GET /api/v1/webapp/group/{groupId}/stats?period=week`
**Authentication:** X-Telegram-Init-Data header + Group admin verification
**Description:** Get group statistics with time period filter

#### Query Parameters:
- `period` (optional): `day`, `week`, `month`, `year` (default: `week`)

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/webapp/group/-1001234567890/stats?period=month" \
  -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash" \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "period": "month",
    "stats": {
      "totalMessages": 5420,
      "flaggedMessages": 156,
      "deletedMessages": 123,
      "mutedUsers": 23,
      "kickedUsers": 8,
      "bannedUsers": 3,
      "averageSpamScore": 0.15,
      "topViolationTypes": [
        {"type": "spam", "count": 89},
        {"type": "profanity", "count": 34},
        {"type": "flood", "count": 33}
      ]
    }
  }
}
```

---

## NLP (Natural Language Processing) Endpoints

### 1. Get NLP Status

**Endpoint:** `GET /api/v1/nlp/status`
**Authentication:** Bearer JWT token required
**Description:** Get NLP service status and capabilities

#### Example Request:
```bash
curl -X GET "https://minnow-good-mostly.ngrok-free.app/api/v1/nlp/status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "ngrok-skip-browser-warning: true"
```

#### Example Response:
```json
{
  "success": true,
  "status": {
    "service": "NLP Processing Service",
    "version": "2.0",
    "model": "gpt-4o-mini",
    "features": {
      "spamDetection": true,
      "profanityFilter": true,
      "combinedAnalysis": true,
      "localFallbacks": true
    },
    "capabilities": [
      "Real-time spam detection",
      "Context-aware profanity filtering",
      "Whitelist keyword support",
      "Parallel processing",
      "Error handling with fallbacks"
    ]
  }
}
```

### 2. Test Spam Detection

**Endpoint:** `POST /api/v1/nlp/test/spam`
**Authentication:** Bearer JWT token required
**Description:** Test spam detection on a message

#### Example Request:
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/nlp/test/spam" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "text": "Buy now! Limited time offer! Click here for amazing deals!",
    "whitelistedKeywords": ["official", "verified"]
  }'
```

#### Example Response:
```json
{
  "success": true,
  "analysis": {
    "isSpam": true,
    "score": 0.85,
    "confidence": 0.92,
    "reasons": [
      "Contains promotional language",
      "Uses urgency tactics",
      "Multiple exclamation marks"
    ]
  },
  "input": {
    "text": "Buy now! Limited time offer! Click here for amazing deals!",
    "whitelistedKeywords": ["official", "verified"]
  }
}
```

### 3. Test Profanity Detection

**Endpoint:** `POST /api/v1/nlp/test/profanity`
**Authentication:** Bearer JWT token required
**Description:** Test profanity detection on a message

#### Example Request:
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/nlp/test/profanity" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "text": "This is a clean message with no bad words."
  }'
```

#### Example Response:
```json
{
  "success": true,
  "analysis": {
    "hasProfanity": false,
    "severity": 0,
    "confidence": 0.98,
    "detectedWords": []
  },
  "input": {
    "text": "This is a clean message with no bad words."
  }
}
```

### 4. Complete Message Analysis

**Endpoint:** `POST /api/v1/nlp/analyze`
**Authentication:** Bearer JWT token required
**Description:** Run complete analysis (spam + profanity) with group-specific interpretation

#### Example Request:
```bash
curl -X POST "https://minnow-good-mostly.ngrok-free.app/api/v1/nlp/analyze" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "text": "Check out this amazing product! Limited time only!",
    "whitelistedKeywords": ["official"],
    "groupId": "-1001234567890"
  }'
```

#### Example Response:
```json
{
  "success": true,
  "analysis": {
    "spam": {
      "isSpam": true,
      "score": 0.78,
      "confidence": 0.89,
      "reasons": ["promotional language", "urgency tactics"]
    },
    "profanity": {
      "hasProfanity": false,
      "severity": 0,
      "confidence": 0.99,
      "detectedWords": []
    }
  },
  "interpretation": {
    "wouldTriggerSpam": true,
    "wouldTriggerProfanity": false,
    "spamThreshold": 0.7,
    "profanityEnabled": true,
    "profanityThreshold": 0.5
  },
  "input": {
    "text": "Check out this amazing product! Limited time only!",
    "whitelistedKeywords": ["official"],
    "groupId": "-1001234567890"
  }
}
```

---

## Common Headers

### Required Headers for All Requests:
- `Content-Type: application/json` (for POST/PUT requests)
- `ngrok-skip-browser-warning: true` (for ngrok tunnels)

### Authentication Headers:

#### JWT Token Authentication:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Telegram WebApp Authentication:
```bash
X-Telegram-Init-Data: user=%7B%22id%22%3A123456789%7D&auth_date=1691234567&hash=telegram_hash
```

---

## Error Responses

### Common Error Format:
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

### Common HTTP Status Codes:

#### 400 Bad Request:
```json
{
  "errors": [
    {
      "msg": "Invalid value",
      "param": "text",
      "location": "body"
    }
  ]
}
```

#### 401 Unauthorized:
```json
{
  "status": "error",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "statusCode": 401,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

#### 403 Forbidden:
```json
{
  "status": "error",
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. User is not admin of this group",
    "statusCode": 403,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

#### 404 Not Found:
```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Group not found",
    "statusCode": 404,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

#### 429 Rate Limited:
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later",
    "statusCode": 429,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

#### 500 Internal Server Error:
```json
{
  "status": "error",
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "statusCode": 500,
    "timestamp": "2025-08-04T22:07:47.248Z"
  }
}
```

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Authentication endpoints:** 5 requests per 15 minutes per IP
- **Health endpoints:** No rate limiting

---

## CORS Policy

The API supports CORS for the following origins:
- `https://web.telegram.org`
- `https://t.me`
- `https://telegram-moderator-dashboard.vercel.app`
- `https://*.ngrok-free.app` (any ngrok domain)
- `http://localhost:*` (development only)

---

## Swagger Documentation

Interactive API documentation is available at:
**URL:** `https://minnow-good-mostly.ngrok-free.app/api/docs`

---

## Important Notes

1. **Ngrok URL Changes:** The ngrok URL changes each time the tunnel is restarted. Update your applications accordingly.

2. **Token Expiration:** JWT tokens have an expiration time. Handle token refresh in your applications.

3. **Group Admin Verification:** Many endpoints verify that the user is actually an admin of the specified group via Telegram API calls.

4. **Rate Limiting:** Be mindful of rate limits, especially for authentication endpoints.

5. **HTTPS Required:** All production endpoints must use HTTPS for security.

6. **Error Handling:** Always implement proper error handling for network failures and API errors.

7. **Header Requirements:** Include the `ngrok-skip-browser-warning` header when using ngrok tunnels to avoid browser warnings.
