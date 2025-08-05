# Error Handling System

This project uses a comprehensive error handling system that provides clean, professional error messages and organized logging.

## Features

- **Standardized Error Types**: Predefined error codes and messages
- **Clean Error Responses**: Consistent JSON error format
- **Professional Logging**: Readable, structured log output
- **Development vs Production**: Different error details based on environment
- **Async Error Handling**: Automatic error catching for async functions
- **Type-specific Errors**: Database, validation, authentication, etc.

## Quick Start

### 1. Import Required Modules

```javascript
import ApiError from '../utils/apiError.js';
import { ERROR_TYPES } from '../utils/errorTypes.js';
import { asyncHandler, successResponse, handleDatabaseError } from '../utils/errorHelpers.js';
```

### 2. Wrap Route Handlers

```javascript
// Old way (manual try/catch)
export const oldHandler = async (req, res, next) => {
    try {
        // Your code here
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// New way (automatic error handling)
export const newHandler = asyncHandler(async (req, res) => {
    // Your code here - errors are automatically caught
    res.json(successResponse(data, 'Operation successful'));
});
```

### 3. Throw Specific Errors

```javascript
// Using predefined error types
throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
throw ApiError.fromType(ERROR_TYPES.UNAUTHORIZED, 'Custom message');

// Using static methods
throw ApiError.notFound('Resource not found');
throw ApiError.badRequest('Invalid input data');
throw ApiError.unauthorized('Token expired');

// Handle database errors automatically
try {
    await db.getUser(userId);
} catch (error) {
    throw handleDatabaseError(error);
}
```

## Error Types

### Authentication Errors (401)
- `UNAUTHORIZED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `TELEGRAM_AUTH_FAILED` - Telegram authentication failed

### Authorization Errors (403)
- `FORBIDDEN` - Insufficient permissions
- `GROUP_ACCESS_DENIED` - Access denied to specific group
- `ADMIN_REQUIRED` - Administrator privileges required

### Not Found Errors (404)
- `NOT_FOUND` - Generic resource not found
- `ENDPOINT_NOT_FOUND` - API endpoint not found
- `GROUP_NOT_FOUND` - Specific group not found
- `USER_NOT_FOUND` - Specific user not found

### Validation Errors (400)
- `VALIDATION_ERROR` - Invalid request data
- `MISSING_REQUIRED_FIELD` - Required field missing
- `INVALID_FORMAT` - Invalid data format

### Server Errors (500)
- `INTERNAL_ERROR` - Generic server error
- `DATABASE_ERROR` - Database operation failed
- `NLP_SERVICE_ERROR` - NLP service error

## API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Your response data
  },
  "timestamp": "2025-08-04T12:00:00.000Z"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "statusCode": 404,
    "timestamp": "2025-08-04T12:00:00.000Z",
    "details": {
      // Additional error details (optional)
    }
  }
}
```

## Examples

### Basic Controller with Error Handling

```javascript
import { asyncHandler, successResponse } from '../utils/errorHelpers.js';
import ApiError from '../utils/apiError.js';
import { ERROR_TYPES } from '../utils/errorTypes.js';

export const getUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // Validate input
    if (!userId || isNaN(userId)) {
        throw ApiError.badRequest('Invalid user ID format');
    }
    
    // Get user from database
    let user;
    try {
        user = await db.getUser(userId);
    } catch (error) {
        throw handleDatabaseError(error);
    }
    
    // Check if user exists
    if (!user) {
        throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
    }
    
    // Check permissions
    if (user.id !== req.user.id && !req.user.isAdmin) {
        throw ApiError.forbidden('Cannot access other user data');
    }
    
    // Return success response
    res.json(successResponse(user, 'User retrieved successfully'));
});
```

### Custom Error with Details

```javascript
export const updateUserSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;
    
    // Validate settings
    const errors = validateSettings(settings);
    if (errors.length > 0) {
        throw ApiError.badRequest('Settings validation failed', errors);
    }
    
    // Update settings
    const updatedUser = await db.updateUserSettings(req.user.id, settings);
    
    res.json(successResponse(updatedUser, 'Settings updated successfully'));
});
```

### Handling Different Error Scenarios

```javascript
export const processPayment = asyncHandler(async (req, res) => {
    const { amount, currency } = req.body;
    
    // Validate required fields
    if (!amount || !currency) {
        throw ApiError.fromType(
            ERROR_TYPES.MISSING_REQUIRED_FIELD,
            'Amount and currency are required',
            { missing: ['amount', 'currency'].filter(field => !req.body[field]) }
        );
    }
    
    // Check business rules
    if (amount < 1) {
        throw ApiError.badRequest('Amount must be at least 1');
    }
    
    if (!['USD', 'EUR'].includes(currency)) {
        throw ApiError.badRequest('Unsupported currency', {
            provided: currency,
            supported: ['USD', 'EUR']
        });
    }
    
    // Process payment
    try {
        const result = await paymentService.process(amount, currency);
        res.json(successResponse(result, 'Payment processed successfully'));
    } catch (error) {
        if (error.type === 'INSUFFICIENT_FUNDS') {
            throw ApiError.badRequest('Insufficient funds');
        }
        if (error.type === 'SERVICE_UNAVAILABLE') {
            throw ApiError.serviceUnavailable('Payment service temporarily unavailable');
        }
        throw ApiError.internal('Payment processing failed');
    }
});
```

## Log Output

The new logging system produces clean, readable output:

### Development Logs
```
2025-08-04 12:00:00 [INFO ] User profile retrieved successfully
  Request:
    GET /api/v1/webapp/user/profile
    IP: 127.0.0.1
    User-Agent: Mozilla/5.0...

2025-08-04 12:00:05 [WARN ] Client Error
  Error Details:
    Code: USER_NOT_FOUND
    Status: 404
  Request:
    GET /api/v1/users/999
    IP: 127.0.0.1
```

### Production Logs
```
2025-08-04 12:00:00 [INFO ] User authenticated
2025-08-04 12:00:05 [ERROR] Database Error
  Error Details:
    Code: DATABASE_ERROR
    Status: 500
  Request:
    POST /api/v1/groups/123/settings
    IP: 203.0.113.1
```

## Migration Guide

### Updating Existing Controllers

1. **Add imports**:
   ```javascript
   import { asyncHandler, successResponse, handleDatabaseError } from '../utils/errorHelpers.js';
   import { ERROR_TYPES } from '../utils/errorTypes.js';
   ```

2. **Wrap handlers with asyncHandler**:
   ```javascript
   // Before
   export const handler = async (req, res, next) => {
       try {
           // code
       } catch (error) {
           next(error);
       }
   };
   
   // After
   export const handler = asyncHandler(async (req, res) => {
       // code - errors automatically handled
   });
   ```

3. **Replace response format**:
   ```javascript
   // Before
   res.json({ success: true, data: result });
   
   // After
   res.json(successResponse(result, 'Operation successful'));
   ```

4. **Use specific error types**:
   ```javascript
   // Before
   throw new ApiError(404, 'Not found');
   
   // After
   throw ApiError.fromType(ERROR_TYPES.USER_NOT_FOUND);
   ```

## Best Practices

1. **Use specific error types** instead of generic ones
2. **Provide helpful error details** for validation errors
3. **Handle database errors** with the helper function
4. **Use asyncHandler** for all async route handlers
5. **Return consistent success responses** with successResponse
6. **Log important operations** with appropriate log levels
7. **Don't expose sensitive information** in error messages

## Testing

The error handling system maintains compatibility with existing tests while providing better error information:

```javascript
// Test error responses
it('should return 404 when user not found', async () => {
    const response = await request(app)
        .get('/api/v1/users/999')
        .expect(404);
    
    expect(response.body).toMatchObject({
        status: 'error',
        error: {
            code: 'USER_NOT_FOUND',
            statusCode: 404
        }
    });
});
```
