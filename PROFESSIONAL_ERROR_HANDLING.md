# 🚀 Professional Error Handling System

## Overview

The Telegram Moderator Bot API now features a comprehensive, professional error handling system that provides:

- ✅ **Clean, structured error responses**
- ✅ **Organized logging with context**
- ✅ **Standardized error codes and types**
- ✅ **Development vs Production error handling**
- ✅ **Automatic error categorization**
- ✅ **Request context tracking**

## Before vs After

### Before (Messy Error Output)
```
2025-08-03T23:46:09.996Z [ERROR]: Not Found {
  "statusCode": 404,
  "stack": "Error: Not Found\n    at file:///D:/telegram-moderator-bot/src/api/server.js:141:10\n    at Layer.handleRequest..."
}
```

### After (Clean Professional Output)
```
2025-08-04 01:09:59 [WARN ] Client Error
  Error Details:
    Code: ENDPOINT_NOT_FOUND
    Status: 404
  Request:
    GET /api/v1/nonexistent
    IP: ::1
    User-Agent: Mozilla/5.0 (Windows NT...)
```

## 🏗️ System Architecture

### 1. Error Types (`src/api/utils/errorTypes.js`)

Standardized error definitions with codes, messages, and status codes:

```javascript
export const ERROR_TYPES = {
    // Authentication errors (401)
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        statusCode: 401
    },
    TELEGRAM_AUTH_FAILED: {
        code: 'TELEGRAM_AUTH_FAILED',
        message: 'Telegram authentication failed',
        statusCode: 401
    },
    
    // Authorization errors (403)
    FORBIDDEN: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        statusCode: 403
    },
    
    // Not found errors (404)
    ENDPOINT_NOT_FOUND: {
        code: 'ENDPOINT_NOT_FOUND',
        message: 'API endpoint not found',
        statusCode: 404
    },
    
    // And many more...
};
```

### 2. Enhanced ApiError Class (`src/api/utils/apiError.js`)

```javascript
// Static methods for common errors
ApiError.unauthorized('Invalid credentials')
ApiError.notFound('User not found')
ApiError.badRequest('Missing required field')
ApiError.internal('Database connection failed')

// From predefined error types
ApiError.fromType(ERROR_TYPES.TELEGRAM_AUTH_FAILED)

// Structured error response
{
    "status": "error",
    "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication required",
        "statusCode": 401,
        "timestamp": "2025-08-04T01:09:59.183Z"
    }
}
```

### 3. Professional Error Handler (`src/api/utils/errorResponder.js`)

Features:
- **Environment-aware**: Different behavior for development vs production
- **Request context**: Logs request details for debugging
- **Error categorization**: Separates client vs server errors
- **Security**: Sanitizes error details in production
- **Headers**: Sets appropriate retry headers for rate limiting

### 4. Helper Utilities (`src/api/utils/errorHelpers.js`)

```javascript
// Async error wrapper
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Standardized success responses
export const successResponse = (data, message = 'Success') => ({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
});

// Database error handling
export const handleDatabaseError = (error) => {
    if (error.code === 'SQLITE_CONSTRAINT') {
        return ApiError.badRequest('Data constraint violation');
    }
    return ApiError.fromType(ERROR_TYPES.DATABASE_ERROR);
};
```

## 📝 How to Use in Controllers

### Old Way (Messy)
```javascript
export const getUser = async (req, res, next) => {
    try {
        const user = await db.getUser(id);
        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }
        res.json({ success: true, data: user });
    } catch (error) {
        logger.error('Error:', error);
        next(new ApiError(500, 'Internal error'));
    }
};
```

### New Way (Professional)
```javascript
export const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    let user;
    try {
        user = await db.getUser(id);
    } catch (error) {
        throw handleDatabaseError(error);
    }
    
    if (!user) {
        throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
    }
    
    res.status(200).json(successResponse(user, 'User retrieved successfully'));
});
```

## 🔄 Migration Guide

### Step 1: Update Imports
```javascript
// Add to your controller files
import { asyncHandler, successResponse, handleDatabaseError } from '../utils/errorHelpers.js';
import { ERROR_TYPES } from '../utils/errorTypes.js';
```

### Step 2: Wrap Route Handlers
```javascript
// Old
export const myFunction = async (req, res, next) => {

// New
export const myFunction = asyncHandler(async (req, res) => {
```

### Step 3: Use Standardized Errors
```javascript
// Old
throw new ApiError(404, 'Not found');

// New
throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
```

### Step 4: Use Success Responses
```javascript
// Old
res.json({ success: true, data: result });

// New
res.status(200).json(successResponse(result, 'Operation successful'));
```

## 🎯 Error Response Examples

### Authentication Error
```json
{
    "status": "error",
    "error": {
        "code": "TELEGRAM_AUTH_FAILED",
        "message": "Telegram authentication failed",
        "statusCode": 401,
        "timestamp": "2025-08-04T01:09:59.183Z"
    }
}
```

### Validation Error
```json
{
    "status": "error",
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Request validation failed",
        "statusCode": 400,
        "timestamp": "2025-08-04T01:09:59.183Z",
        "details": [
            {
                "field": "email",
                "message": "Valid email is required",
                "value": "invalid-email"
            }
        ]
    }
}
```

### Rate Limiting Error
```json
{
    "status": "error",
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many requests, please try again later",
        "statusCode": 429,
        "timestamp": "2025-08-04T01:09:59.183Z"
    }
}
```

### Success Response
```json
{
    "status": "success",
    "message": "User retrieved successfully",
    "data": {
        "id": 123,
        "username": "john_doe",
        "email": "john@example.com"
    },
    "timestamp": "2025-08-04T01:09:59.183Z"
}
```

## 📊 Logging Improvements

### Development Logs
```
2025-08-04 01:09:59 [WARN ] Client Error
  Error Details:
    Code: VALIDATION_ERROR
    Status: 400
    Details: [{"field":"email","message":"Valid email required"}]
  Request:
    POST /api/v1/users
    IP: ::1
    User-Agent: PostmanRuntime/7.32.3
  Stack Trace:
    ApiError: Request validation failed
        at validateRequest (/src/api/utils/errorHelpers.js:23:15)
        at async /src/api/controllers/userController.js:45:12
```

### Production Logs
```
2025-08-04 01:09:59 [WARN ] Client Error
  Error Details:
    Code: VALIDATION_ERROR
    Status: 400
  Request:
    POST /api/v1/users
    IP: 192.168.1.100
    User-Agent: PostmanRuntime/7.32.3
```

## 🔒 Security Features

### Production Sanitization
- Stack traces hidden in production
- Internal error details masked
- Generic error messages for security

### Request Context
- IP address logging
- User agent tracking
- Request method and URL
- Timestamp for audit trails

### Rate Limiting Integration
- Standardized rate limit responses
- Retry-After headers
- Proper status codes

## 🎛️ Configuration

### Environment Variables
```bash
# Development: Show detailed errors and stack traces
NODE_ENV=development
LOG_LEVEL=debug

# Production: Hide sensitive error details
NODE_ENV=production
LOG_LEVEL=info
```

### Error Handler Features
- **Development**: Full error details, stack traces, request context
- **Production**: Sanitized errors, no stack traces, security-focused
- **Testing**: Simplified error format for test assertions

## 📈 Benefits

1. **🧹 Clean Logs**: No more messy stack traces cluttering logs
2. **🔍 Better Debugging**: Structured error information with context
3. **🛡️ Security**: Production-safe error handling
4. **📱 API Consistency**: Standardized error responses across all endpoints
5. **⚡ Developer Experience**: Easy-to-use error utilities
6. **📊 Monitoring**: Structured logs perfect for log aggregation tools
7. **🎯 Error Tracking**: Consistent error codes for monitoring systems

## 🚀 Quick Start

1. **Import utilities in your controller**:
```javascript
import { asyncHandler, successResponse, handleDatabaseError } from '../utils/errorHelpers.js';
import { ERROR_TYPES } from '../utils/errorTypes.js';
```

2. **Wrap your route handler**:
```javascript
export const myEndpoint = asyncHandler(async (req, res) => {
    // Your logic here
});
```

3. **Use standardized errors**:
```javascript
throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
```

4. **Return success responses**:
```javascript
res.status(200).json(successResponse(data, 'Success message'));
```

That's it! Your API now has professional, consistent error handling! 🎉
