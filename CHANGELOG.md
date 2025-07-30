# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-07-30

### Added
- **Super Admin Commands System** - Complete super admin functionality for bot owners
  - `/globalstats` - View comprehensive global bot statistics across all groups
  - `/maintenance <on|off>` - Toggle maintenance mode with status tracking
  - `/broadcast <message>` - Send announcements to all registered groups
  - `/forceupdate` - Force refresh bot configurations and settings
  - `/clearcache` - Clear all cached data (admin cache, settings cache, etc.)
- **Role-based Command Registration** - Commands automatically registered based on user permissions
  - Public commands for all users
  - Admin commands for group administrators
  - Super admin commands for bot owner (requires ADMIN_USER_ID in env)
- **Private Chat Super Admin Support** - Super admin commands work in both private chats and groups
- **Environment Variable Validation** - Proper validation and logging for super admin configuration
- **ES Module Compatibility** - Full ES6 module support with proper import/export

### Enhanced
- **WebApp API Endpoints** - Added dedicated WebApp routes for better separation
  - `GET /api/v1/webapp/group/:groupId/settings` - WebApp-specific group settings
  - `PUT /api/v1/webapp/group/:groupId/settings` - WebApp-specific settings update
  - `GET /api/v1/webapp/group/:groupId/stats` - WebApp-specific group statistics
- **Command Help System** - Dynamic help text with role-based command visibility
- **Database Operations** - Improved error handling and transaction management
- **Logging System** - Enhanced logging with proper debug levels and structured output

### Fixed
- **Database Table Consistency** - Fixed table name mismatches (audit_logs vs audit_log)
- **JavaScript Runtime Errors** - Fixed const variable assignment errors in command handlers
- **Command Recognition** - Improved command parsing and validation
- **Menu Keyboard Consistency** - Unified emoji usage across all keyboard menus
- **Module Import Issues** - Resolved require() calls in ES module environment

### Security
- **Super Admin Authorization** - Strict user ID validation for super admin commands
- **Command Scope Limitation** - Proper permission checks for all command types
- **Environment Variable Security** - Sensitive configuration properly protected

### Performance
- **Parallel Processing** - Improved response times with concurrent operations
- **Cache Management** - Better cache handling with super admin cache clearing
- **Database Optimization** - Enhanced query performance and indexing

### Testing
- **Comprehensive Test Suite** - 152 tests passing across 15 test suites
- **Super Admin Testing** - Added tests for all super admin functionality
- **API Integration Tests** - Complete WebApp API endpoint testing
- **Database Tests** - Enhanced database operation testing

## [1.1.0] - 2025-07-29

### Added
- **NLP Testing Endpoints** - Complete NLP service testing capabilities
  - `GET /api/v1/nlp/status` - NLP service health check
  - `POST /api/v1/nlp/test/spam` - Test spam detection algorithms
  - `POST /api/v1/nlp/test/profanity` - Test profanity filtering
  - `POST /api/v1/nlp/analyze` - Complete message analysis
- **Enhanced API Documentation** - Comprehensive Swagger documentation
- **Development Server** - Dedicated server for serving HTML examples
- **Example Applications** - Multiple integration examples for different use cases

### Enhanced
- **Authentication System** - Improved Telegram WebApp authentication
- **CORS Configuration** - Better cross-origin resource sharing setup
- **Rate Limiting** - Enhanced request throttling and protection
- **Error Handling** - Improved error responses and logging

### Fixed
- **API Endpoint Consistency** - Standardized response formats
- **Security Headers** - Proper security header configuration
- **Database Connections** - Better connection pooling and error handling

## [1.0.0] - 2025-07-28

### Added
- **Initial Release** - Complete Telegram moderator bot with AI-powered features
- **AI-Powered Moderation** - Smart spam detection with GPT-4o-mini integration
- **Advanced Profanity Filter** - Hybrid local and AI profanity detection
- **Strike System** - Comprehensive user strike tracking and management
- **Group Management** - Complete group settings and configuration
- **Admin Commands** - Full suite of administrator commands
- **User Commands** - Public commands for all users
- **Database System** - SQLite-based data persistence
- **Logging System** - Comprehensive logging with Winston
- **Docker Support** - Containerization for easy deployment
- **Testing Framework** - Vitest-based testing with high coverage

### Features
- Real-time message moderation
- Configurable penalty levels
- Keyword whitelisting
- User strike history
- Audit logging
- Group statistics
- Admin management
- Automatic moderation actions

---

## Legend

- **Added** - New features
- **Enhanced** - Improvements to existing features
- **Fixed** - Bug fixes
- **Security** - Security-related changes
- **Performance** - Performance improvements
- **Testing** - Testing-related changes
- **Deprecated** - Features that will be removed
- **Removed** - Features that were removed
