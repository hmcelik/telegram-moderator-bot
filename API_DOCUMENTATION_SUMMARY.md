# API Documentation Summary

**✅ UNIFIED API: Now supports both JWT and WebApp authentication on the same endpoints**

All APIs are documented using JSDoc comments in the route files and automatically generate Swagger documentation at: **http://localhost:3000/api/docs**

## 📚 Documentation Sources

The API documentation is now maintained in two places:
1. **Interactive Swagger UI**: http://localhost:3000/api/docs (Generated from JSDoc)
2. **Comprehensive Markdown**: `API_DOCUMENTATION.md` (Complete reference guide)

## 🔧 Current Implementation

- **Documentation Method**: JSDoc comments in route files
- **Auto-Generation**: swagger-jsdoc generates OpenAPI spec from code comments
- **No Static Files**: Removed static `swagger.json` file - documentation stays in sync with code
- **Live Updates**: Changes to JSDoc comments automatically reflect in documentation after server restart

## � **UNIFIED API ARCHITECTURE** 

**✅ SOLUTION IMPLEMENTED**: Single API that supports both authentication methods!

### **🌟 Unified Endpoints** (`/api/v1/`)
- **Dual Authentication**: Supports both JWT tokens AND Telegram WebApp initData
- **Single Implementation**: One codebase, maintained once
- **Enhanced Features**: Best features from both previous implementations
- **Consistent Responses**: Standardized `{success, message, data, timestamp}` format

### **Authentication Methods Supported:**

#### 🔑 **JWT Bearer Token** (External websites)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 📱 **Telegram WebApp initData** (Mini Apps)
```http
X-Telegram-Init-Data: user=%7B%22id%22%3A123456789...
```

### **📋 Response Format Standardization**

**✅ ALL endpoints now return consistent format:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* actual response data */ },
  "timestamp": "2024-03-20T14:30:00.000Z",
  "meta": { /* optional metadata like pagination */ }
}
```

## Available Unified API Endpoints

### 🔧 System Endpoints
- `GET /` - API Information
- `GET /api/v1/health` - Health Check
- `GET /api/docs` - Swagger Documentation

### 🔐 Authentication Endpoints 
- `POST /api/v1/auth/verify` - Universal Telegram Authentication
- `POST /api/v1/auth/login-widget` - Telegram Login Widget Authentication
- `POST /api/v1/auth/refresh` - Refresh JWT Token
- `GET /api/v1/auth/verify-token` - Verify JWT Token

### 👥 **Group Management Endpoints** (🌟 UNIFIED)

#### Enhanced Features:
- **Dual Auth**: JWT + WebApp support on same endpoints
- **Rich Data**: Enhanced group info with basic stats
- **Comprehensive Settings**: Complete settings management
- **Advanced Stats**: Detailed analytics from WebApp version
- **Audit Logs**: Full audit trail with export functionality

**Endpoints:**
- `GET /api/v1/groups` - **Enhanced** list with stats and settings preview
- `GET /api/v1/groups/{groupId}/settings` - **Complete** settings with group info
- `PUT /api/v1/groups/{groupId}/settings` - **Validated** settings updates
- `GET /api/v1/groups/{groupId}/stats` - **Comprehensive** statistics (period-based)
- `GET /api/v1/groups/{groupId}/audit` - **Paginated** audit log with filtering
- `GET /api/v1/groups/{groupId}/audit/export` - **Export** audit log (CSV/JSON)

### ⚡ **Strike Management Endpoints** (🌟 UNIFIED)
- `GET /api/v1/groups/{groupId}/users/{userId}/strikes` - Enhanced strike history
- `POST /api/v1/groups/{groupId}/users/{userId}/strikes` - Add strikes with validation
- `DELETE /api/v1/groups/{groupId}/users/{userId}/strikes` - Remove strikes  
- `PUT /api/v1/groups/{groupId}/users/{userId}/strikes` - Set exact strike count

### 🤖 NLP Processing Endpoints (Shared)
- `GET /api/v1/nlp/status` - Get NLP Service Status
- `POST /api/v1/nlp/test/spam` - Test Spam Detection
- `POST /api/v1/nlp/test/profanity` - Test Profanity Detection
- `POST /api/v1/nlp/analyze` - Complete Message Analysis

### 📱 **WebApp Endpoints** (⚠️ DEPRECATED - Use unified endpoints above)
- `POST /api/v1/webapp/auth` - ⚠️ Use `/api/v1/auth/verify` instead  
- `GET /api/v1/webapp/user/profile` - ⚠️ Use `/api/v1/groups` for group data
- `GET /api/v1/webapp/user/groups` - ⚠️ Use `/api/v1/groups` instead
- `GET /api/v1/webapp/group/{groupId}/settings` - ⚠️ Use `/api/v1/groups/{groupId}/settings`
- `PUT /api/v1/webapp/group/{groupId}/settings` - ⚠️ Use `/api/v1/groups/{groupId}/settings`
- `GET /api/v1/webapp/group/{groupId}/stats` - ⚠️ Use `/api/v1/groups/{groupId}/stats`

## 🎯 **Key Improvements**

### ✅ **Unified Architecture**
- **Single API**: No more duplicate endpoints
- **Dual Authentication**: JWT + WebApp on same routes
- **Best of Both**: Enhanced features from WebApp + External API reliability

### ✅ **Response Consistency** 
- **Standardized Format**: All responses follow same pattern
- **No More Confusion**: data.data vs data resolved
- **Pagination Support**: Consistent pagination across endpoints

### ✅ **Enhanced Features**
- **Rich Group Data**: Groups list includes stats and settings preview
- **Comprehensive Stats**: Period-based analytics with detailed metrics
- **Complete Settings**: Full settings management with validation
- **Audit Trail**: Detailed audit logs with export functionality

### ✅ **Backward Compatibility**
- **Legacy Support**: Old `/webapp/` endpoints still work (deprecated)
- **Gradual Migration**: Can migrate clients at your own pace
- **Same Functionality**: All existing features preserved

## Documentation Features

✅ **Complete Swagger/OpenAPI 3.0 Documentation**
- Interactive API explorer
- Request/response schemas
- Authentication examples
- Error code documentation
- Parameter validation details

✅ **Enhanced API Information**
- Detailed descriptions for all endpoints
- Security requirements clearly marked
- Request/response examples
- Comprehensive error handling documentation

✅ **Organized by Categories**
- System & Health
- Authentication
- WebApp (Mini Apps)
- Groups
- Strike Management
- Audit Log
- NLP Processing

## Authentication Methods Documented

1. **JWT Bearer Token** - For standard API access
2. **Telegram WebApp Auth** - For Mini Apps (X-Telegram-Init-Data header)
3. **Telegram Login Widget** - For external websites

## Testing the Documentation

1. Visit: http://localhost:3000/api/docs
2. Explore the interactive API documentation
3. Test endpoints directly from the Swagger UI
4. View detailed schemas and examples

All endpoints are now fully documented and ready for development and integration!
