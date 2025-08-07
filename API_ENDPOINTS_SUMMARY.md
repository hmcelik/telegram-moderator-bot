# Telegram Moderator Bot API Documentation

## Overview
The Telegram Moderator Bot API provides comprehensive endpoints for managing Telegram group moderation, authentication, strike systems, and NLP content analysis.

## Base URL
- **Local Development**: `http://localhost:3000`
- **Documentation**: `http://localhost:3000/api/docs`

## Authentication
The API supports multiple authentication methods:
- **JWT Bearer Token**: For standard API access via `Authorization: Bearer <token>`
- **Telegram WebApp**: Using `X-Telegram-Init-Data` header
- **Telegram Login Widget**: For external website integration

### Unified Authentication
The unified groups API (`/api/v1/groups/*`) supports **both JWT and WebApp authentication** on the same endpoints, making integration flexible and seamless. The legacy WebApp endpoints (`/api/v1/webapp/*`) are deprecated but maintained for backward compatibility.

## API Endpoints

### 🏥 System Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | API information and available endpoints | ❌ |
| `GET` | `/api/v1/health` | Basic health check | ❌ |
| `GET` | `/api/v1/status` | Detailed system status | ❌ |
| `GET` | `/api/v1/info` | Comprehensive API information | ❌ |
| `GET` | `/api/v1/metrics` | System and application metrics | ❌ |

### 🔐 Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/verify` | Verify Telegram authentication | ❌ |
| `POST` | `/api/v1/auth/login-widget` | Login widget authentication | ❌ |

### 📱 WebApp Endpoints (Legacy - Deprecated)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/webapp/auth` | WebApp authentication | Telegram WebApp |
| `GET` | `/api/v1/webapp/user/profile` | Get user profile | Telegram WebApp |
| `GET` | `/api/v1/webapp/user/groups` | Get user's admin groups | Telegram WebApp |
| `GET` | `/api/v1/webapp/group/{groupId}/settings` | Get group settings | Telegram WebApp |
| `PUT` | `/api/v1/webapp/group/{groupId}/settings` | Update group settings | Telegram WebApp |
| `GET` | `/api/v1/webapp/group/{groupId}/stats` | Get enhanced group statistics | Telegram WebApp |
| `GET` | `/api/v1/webapp/group/{groupId}/users` | Get detailed user activity stats | Telegram WebApp |
| `GET` | `/api/v1/webapp/group/{groupId}/patterns` | Get activity patterns analysis | Telegram WebApp |
| `GET` | `/api/v1/webapp/group/{groupId}/effectiveness` | Get moderation effectiveness metrics | Telegram WebApp |
| `GET` | `/api/v1/webapp/health` | WebApp health check | ❌ |

### 👥 Unified Groups Endpoints (Recommended)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/groups` | List user's admin groups | JWT/WebApp |
| `GET` | `/api/v1/groups/{groupId}/settings` | Get group settings | JWT/WebApp + Admin |
| `PUT` | `/api/v1/groups/{groupId}/settings` | Update group settings | JWT/WebApp + Admin |
| `GET` | `/api/v1/groups/{groupId}/stats` | Get group statistics | JWT/WebApp + Admin |
| `GET` | `/api/v1/groups/{groupId}/audit` | Get audit log (paginated) | JWT + Admin |
| `GET` | `/api/v1/groups/{groupId}/audit/export` | Export audit log (CSV/JSON) | JWT + Admin |

### ⚡ Strike Management Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/groups/{groupId}/users/{userId}/strikes` | Get user's strike history | JWT/WebApp + Admin |
| `POST` | `/api/v1/groups/{groupId}/users/{userId}/strikes` | Add strikes to user | JWT/WebApp + Admin |
| `DELETE` | `/api/v1/groups/{groupId}/users/{userId}/strikes` | Remove strikes from user | JWT/WebApp + Admin |
| `PUT` | `/api/v1/groups/{groupId}/users/{userId}/strikes` | Set user's strike count | JWT/WebApp + Admin |

### 🧠 NLP Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/nlp/status` | NLP service status | JWT |
| `POST` | `/api/v1/nlp/test/spam` | Test spam detection | JWT |
| `POST` | `/api/v1/nlp/test/profanity` | Test profanity detection | JWT |
| `POST` | `/api/v1/nlp/analyze` | Complete message analysis | JWT |

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2025-08-06T12:00:00.000Z"
  }
}
```

## Authentication Headers

### JWT Bearer Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Telegram WebApp
```http
X-Telegram-Init-Data: query_id=AAE7XA...
```

## Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Development**: Rate limiting disabled for localhost

## Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `TELEGRAM_AUTH_FAILED` | Telegram authentication failed |
| `USER_NOT_FOUND` | User not found |
| `GROUP_NOT_FOUND` | Group not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |
| `ENDPOINT_NOT_FOUND` | API endpoint not found |

## Features
- ✅ Telegram Mini App Support
- ✅ Telegram Login Widget Support
- ✅ JWT Authentication
- ✅ Group Moderation Management
- ✅ Strike System with History
- ✅ Comprehensive Audit Logging
- ✅ NLP Content Analysis
- ✅ Rate Limiting & Security
- ✅ CORS Support
- ✅ OpenAPI/Swagger Documentation
- ✅ Export Capabilities (CSV/JSON)
- ✅ Real-time System Metrics

## Getting Started

1. **Start the API server**:
   ```bash
   npm run dev:api
   ```

2. **Access Swagger Documentation**:
   Open `http://localhost:3000/api/docs`

3. **Test API Health**:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

4. **Get API Information**:
   ```bash
   curl http://localhost:3000/api/v1/info
   ```

## Example Usage

### Get System Status
```bash
curl -X GET http://localhost:3000/api/v1/status
```

### Authenticate with JWT
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"id": 123456789, "first_name": "John", "auth_date": 1691234567, "hash": "..."}'
```

### Get Groups (with JWT)
```bash
curl -X GET http://localhost:3000/api/v1/groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Analyze Message with NLP
```bash
curl -X POST http://localhost:3000/api/v1/nlp/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Check out this amazing deal!"}'
```

## Support
For detailed API documentation with interactive examples, visit the Swagger UI at:
`http://localhost:3000/api/docs`
