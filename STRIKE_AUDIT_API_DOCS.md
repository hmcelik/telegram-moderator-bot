# Strike Management & Audit Log API Documentation

This document describes the newly implemented Strike Management API and Audit Log API endpoints.

## Strike Management API

The Strike Management API provides complete CRUD operations for managing user strikes in Telegram groups.

### Base URL
```
/api/v1/groups/{groupId}/users/{userId}/strikes
```

### Authentication
All endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- Group admin privileges for the specified group

### Endpoints

#### 1. GET - Get User Strike History
```http
GET /api/v1/groups/{groupId}/users/{userId}/strikes
```

**Parameters:**
- `groupId` (path): Group ID
- `userId` (path): User ID
- `limit` (query, optional): Number of history entries (1-100, default: 50)
- `offset` (query, optional): Number of entries to skip (default: 0)
- `includeHistory` (query, optional): Include detailed history (default: true)

**Response:**
```json
{
  "userId": "string",
  "groupId": "string", 
  "currentStrikes": 5,
  "lastStrikeTimestamp": "2023-01-01T00:00:00.000Z",
  "history": [
    {
      "id": 1,
      "timestamp": "2023-01-01T00:00:00.000Z",
      "type": "MANUAL-STRIKE-ADD",
      "action": "MANUAL-STRIKE-ADD",
      "amount": 2,
      "reason": "Spam violation",
      "admin": {
        "id": "123456789",
        "firstName": "Admin",
        "username": "admin"
      },
      "violationType": null,
      "classificationScore": null,
      "spamScore": null,
      "profanityScore": null
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 1
  }
}
```

#### 2. POST - Add Strikes
```http
POST /api/v1/groups/{groupId}/users/{userId}/strikes
```

**Body:**
```json
{
  "amount": 2,
  "reason": "Spam violation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Added 2 strike(s) to user 123456789",
  "data": {
    "userId": "123456789",
    "groupId": "-1001234567890",
    "previousCount": 3,
    "newCount": 5,
    "amountAdded": 2,
    "reason": "Spam violation",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

#### 3. DELETE - Remove Strikes
```http
DELETE /api/v1/groups/{groupId}/users/{userId}/strikes
```

**Body:**
```json
{
  "amount": 1,
  "reason": "Appeal accepted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Removed 1 strike(s) from user 123456789",
  "data": {
    "userId": "123456789",
    "groupId": "-1001234567890",
    "previousCount": 5,
    "newCount": 4,
    "amountRemoved": 1,
    "reason": "Appeal accepted",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

#### 4. PUT - Set Strike Count
```http
PUT /api/v1/groups/{groupId}/users/{userId}/strikes
```

**Body:**
```json
{
  "count": 10,
  "reason": "Manual adjustment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Set strike count to 10 for user 123456789",
  "data": {
    "userId": "123456789",
    "groupId": "-1001234567890",
    "previousCount": 5,
    "newCount": 10,
    "countSet": 10,
    "reason": "Manual adjustment",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

### Validation Rules

- **Amount (POST/DELETE)**: Must be between 1 and 100
- **Count (PUT)**: Must be between 0 and 1000
- **Reason**: Optional, max 500 characters

## Audit Log API

The Audit Log API provides access to moderation action history with filtering, pagination, and export capabilities.

### Base URL
```
/api/v1/groups/{groupId}/audit
```

### Authentication
- Valid JWT token in Authorization header: `Bearer <token>`
- Group admin privileges for the specified group

### Endpoints

#### 1. GET - Paginated Audit Log
```http
GET /api/v1/groups/{groupId}/audit
```

**Parameters:**
- `groupId` (path): Group ID
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Entries per page (1-200, default: 50)
- `userId` (query, optional): Filter by specific user ID
- `type` (query, optional): Filter by action type (AUTO, MANUAL-STRIKE-ADD, MANUAL-STRIKE-REMOVE, MANUAL-STRIKE-SET)
- `startDate` (query, optional): Filter from date (ISO 8601)
- `endDate` (query, optional): Filter until date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "2023-01-01T00:00:00.000Z",
      "chatId": "-1001234567890",
      "userId": "123456789",
      "type": "MANUAL-STRIKE-ADD",
      "action": "Added 2 strike(s)",
      "details": {
        "violationType": null,
        "reason": "Spam violation",
        "amount": 2,
        "admin": {
          "id": "987654321",
          "firstName": "Admin",
          "username": "admin"
        },
        "targetUser": {
          "id": "123456789"
        },
        "classificationScore": null,
        "spamScore": null,
        "profanityScore": null,
        "profanityType": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "userId": null,
    "type": null,
    "startDate": null,
    "endDate": null
  }
}
```

#### 2. GET - Export Audit Log
```http
GET /api/v1/groups/{groupId}/audit/export
```

**Parameters:**
- `groupId` (path): Group ID
- `format` (query, optional): Export format (csv, json - default: csv)
- `userId` (query, optional): Filter by specific user ID
- `type` (query, optional): Filter by action type
- `startDate` (query, optional): Filter from date (ISO 8601)
- `endDate` (query, optional): Filter until date (ISO 8601)

**CSV Response:**
Returns a downloadable CSV file with headers:
- ID, Timestamp, Chat ID, User ID, Type, Action, Violation Type, Reason, Amount, Admin ID, Admin Name, Admin Username, Classification Score, Spam Score, Profanity Score

**JSON Response:**
Returns a downloadable JSON array with structured audit log data.

### Action Types

- **AUTO**: Automatic strikes from content moderation
- **MANUAL-STRIKE-ADD**: Manual strike addition by admin
- **MANUAL-STRIKE-REMOVE**: Manual strike removal by admin
- **MANUAL-STRIKE-SET**: Manual strike count adjustment by admin

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Amount must be between 1 and 100",
      "path": "amount",
      "location": "body"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized access"
}
```

**403 Forbidden:**
```json
{
  "error": "Not authorized as group admin"
}
```

**404 Not Found:**
```json
{
  "error": "Group not found"
}
```

## Example Usage

### Add strikes via API
```bash
curl -X POST \
  https://your-api.com/api/v1/groups/-1001234567890/users/123456789/strikes \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 2,
    "reason": "Repeated spam violations"
  }'
```

### Get user strike history
```bash
curl -X GET \
  'https://your-api.com/api/v1/groups/-1001234567890/users/123456789/strikes?limit=20&includeHistory=true' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Export audit log as CSV
```bash
curl -X GET \
  'https://your-api.com/api/v1/groups/-1001234567890/audit/export?format=csv&startDate=2023-01-01T00:00:00.000Z' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --output audit_log.csv
```

### Get paginated audit log with filters
```bash
curl -X GET \
  'https://your-api.com/api/v1/groups/-1001234567890/audit?page=1&limit=50&type=MANUAL-STRIKE-ADD&userId=123456789' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Integration Notes

1. **Rate Limiting**: All endpoints are subject to the API's rate limiting rules
2. **Authentication**: Requires valid Telegram-based JWT authentication
3. **Permissions**: Only group administrators can access these endpoints
4. **Logging**: All manual actions are automatically logged in the audit trail
5. **Data Retention**: Audit logs follow the configured data retention policies
6. **Export Limits**: Export endpoints have a maximum limit of 10,000 entries per request
