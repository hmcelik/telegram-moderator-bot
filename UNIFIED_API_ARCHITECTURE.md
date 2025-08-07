# Unified API Architecture

## Overview

The Telegram Moderator Bot API has been upgraded to a **Unified Architecture** that supports multiple authentication methods on the same endpoints, providing maximum flexibility for different client types while maintaining backward compatibility.

## Architecture Benefits

### ✅ Unified Endpoints
- **Single endpoint URLs** for all client types
- **Dual authentication support** (JWT + WebApp) on same routes
- **Consistent response format** across all endpoints
- **Reduced code duplication** and maintenance overhead

### ✅ Enhanced Security
- **Robust error handling** with proper API error responses
- **Rate limiting** with different limits for auth vs general endpoints
- **CORS support** for web applications and Telegram Mini Apps
- **Input validation** with express-validator

### ✅ Developer Experience
- **Automatic authentication detection** - use JWT or WebApp data
- **Comprehensive Swagger documentation** with interactive examples
- **Consistent error codes and messages** across all endpoints
- **Flexible deployment options** (local, Vercel, Docker)

## Authentication Flow

### Dual Authentication Support
```javascript
// The unifiedAuth middleware automatically detects and validates:

// Option 1: JWT Bearer Token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Option 2: Telegram WebApp Init Data
X-Telegram-Init-Data: query_id=AAE7XA...

// Same endpoint works with both!
GET /api/v1/groups/{groupId}/settings
```

### Authentication Priority
1. **JWT Token** (if present) - processed first
2. **Telegram WebApp Data** (fallback) - processed if no JWT
3. **Error Response** - if neither method provided

## API Structure

### Core Endpoints

#### System & Health
- `GET /` - API information
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/status` - Detailed system status
- `GET /api/v1/info` - Comprehensive API info
- `GET /api/v1/metrics` - System metrics

#### Authentication
- `POST /api/v1/auth/verify` - Telegram login verification
- `POST /api/v1/auth/login-widget` - Login widget auth
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/verify-token` - Token verification

#### Unified Groups (Recommended)
- `GET /api/v1/groups` - List admin groups
- `GET /api/v1/groups/{groupId}/settings` - Get settings
- `PUT /api/v1/groups/{groupId}/settings` - Update settings
- `GET /api/v1/groups/{groupId}/stats` - Get statistics
- `GET /api/v1/groups/{groupId}/audit` - Get audit log
- `GET /api/v1/groups/{groupId}/audit/export` - Export audit log

#### Strike Management
- `GET /api/v1/groups/{groupId}/users/{userId}/strikes` - Get strikes
- `POST /api/v1/groups/{groupId}/users/{userId}/strikes` - Add strikes
- `DELETE /api/v1/groups/{groupId}/users/{userId}/strikes` - Remove strikes
- `PUT /api/v1/groups/{groupId}/users/{userId}/strikes` - Set strikes

#### Legacy WebApp (Deprecated but Supported)
- `POST /api/v1/webapp/auth` - WebApp authentication
- `GET /api/v1/webapp/user/*` - User endpoints
- `GET /api/v1/webapp/group/{groupId}/*` - Group endpoints
- `GET /api/v1/webapp/health` - Health check

#### NLP Services
- `GET /api/v1/nlp/status` - NLP service status
- `POST /api/v1/nlp/test/spam` - Test spam detection
- `POST /api/v1/nlp/test/profanity` - Test profanity
- `POST /api/v1/nlp/analyze` - Complete analysis

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "timestamp": "2025-08-07T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "timestamp": "2025-08-07T12:00:00.000Z"
  }
}
```

## Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Development**: No limits for localhost
- **Skip paths**: Health checks and documentation

### CORS Configuration
- **Telegram WebApp** origins supported
- **Custom origins** via environment variables
- **Development** localhost support
- **ngrok tunnels** for testing

### Input Validation
- **express-validator** for all endpoints
- **Comprehensive schemas** for request bodies
- **Path parameter validation** for IDs
- **Query parameter validation** with limits

## Error Handling

### Standardized Error Types
```javascript
ERROR_TYPES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_INVALID: 'TOKEN_INVALID', 
  TELEGRAM_AUTH_FAILED: 'TELEGRAM_AUTH_FAILED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation & Input
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  NOT_FOUND: 'NOT_FOUND',
  
  // System
  DATABASE_ERROR: 'DATABASE_ERROR',
  HTTP_500: 'HTTP_500',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
}
```

### Error Response Flow
1. **ApiError creation** - Standardized error objects
2. **Error middleware** - Global error handler
3. **Consistent logging** - Structured error logs
4. **Client-friendly messages** - User-facing error text

## Migration Guide

### From Legacy WebApp to Unified API

#### Before (Legacy)
```javascript
// Separate endpoints for different auth types
POST /api/v1/webapp/auth           // WebApp only
GET  /api/v1/groups/{id}/settings  // JWT only
```

#### After (Unified)
```javascript
// Same endpoint, multiple auth methods
GET /api/v1/groups/{id}/settings
// Supports both:
// - Authorization: Bearer <jwt>
// - X-Telegram-Init-Data: <webAppData>
```

### Code Examples

#### JavaScript/Node.js
```javascript
// Works with both auth methods
const getGroupSettings = async (groupId, authType, authData) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authType === 'jwt') {
    headers['Authorization'] = `Bearer ${authData}`;
  } else if (authType === 'webapp') {
    headers['X-Telegram-Init-Data'] = authData;
  }
  
  const response = await fetch(`/api/v1/groups/${groupId}/settings`, {
    headers
  });
  
  return response.json();
};
```

#### Python
```python
import requests

def get_group_settings(group_id, auth_type, auth_data):
    headers = {'Content-Type': 'application/json'}
    
    if auth_type == 'jwt':
        headers['Authorization'] = f'Bearer {auth_data}'
    elif auth_type == 'webapp':
        headers['X-Telegram-Init-Data'] = auth_data
    
    response = requests.get(f'/api/v1/groups/{group_id}/settings', headers=headers)
    return response.json()
```

## Deployment Considerations

### Environment Variables
```bash
# Required
BOT_TOKEN=your_bot_token
JWT_SECRET=your_jwt_secret

# Optional
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # General limit
AUTH_RATE_LIMIT_MAX_REQUESTS=5     # Auth limit
TRUST_PROXY=true                   # For production
ADDITIONAL_ALLOWED_ORIGINS=https://yourdomain.com
```

### Production Checklist
- ✅ Set `NODE_ENV=production`
- ✅ Configure `TRUST_PROXY=true` for reverse proxies
- ✅ Add production domains to CORS origins
- ✅ Set strong `JWT_SECRET`
- ✅ Configure rate limiting appropriately
- ✅ Enable proper logging levels

## Testing

### Test Coverage
- **205 tests passing** ✅
- **Unit tests** for all controllers
- **Integration tests** for API endpoints
- **Authentication middleware tests**
- **Database interaction tests**
- **End-to-end workflow tests**

### Test Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- __tests__/api/groups.test.js
npm test -- __tests__/api/auth.test.js
npm test -- __tests__/api/strikes.test.js
```

## Monitoring & Logging

### Structured Logging
- **Request/Response logging** with correlation IDs
- **Error tracking** with stack traces
- **Performance metrics** for response times
- **Authentication events** for security auditing

### Health Monitoring
- **Health check endpoints** for uptime monitoring
- **System metrics** for performance tracking
- **Database connection status**
- **NLP service availability**

## Future Enhancements

### Planned Features
- 📊 **Enhanced Analytics** - More detailed metrics and dashboards
- 🔔 **Real-time Notifications** - WebSocket support for live updates
- 📱 **Mobile SDK** - Native mobile app integration
- 🌐 **GraphQL API** - Alternative query interface
- 🔒 **OAuth2 Support** - Additional authentication methods

### API Versioning
- **Current version**: `v1`
- **Backward compatibility** maintained
- **Migration guides** for future versions
- **Deprecation notices** with timeline

---

## Conclusion

The Unified API Architecture provides a robust, scalable, and developer-friendly foundation for the Telegram Moderator Bot. With dual authentication support, comprehensive error handling, and extensive documentation, it offers the flexibility needed for various client types while maintaining security and performance standards.

For questions or support, refer to:
- 📚 **Interactive Documentation**: `http://localhost:3000/api/docs`
- 📋 **API Summary**: `API_ENDPOINTS_SUMMARY.md`
- 🔧 **Implementation Details**: `API_IMPLEMENTATION_SUMMARY.md`
