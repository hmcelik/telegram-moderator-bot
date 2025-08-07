# Enhanced Analytics API Documentation

## Overview

The enhanced analytics API provides comprehensive insights into moderation activities, user behavior, and system effectiveness. This documentation covers the new endpoints and data structures introduced with the enhanced logging system.

## New API Endpoints

### 1. Enhanced Group Statistics

**GET** `/api/v1/webapp/group/{groupId}/stats`

Returns comprehensive moderation statistics for a specific group.

#### Enhanced Features:
- **Total Messages**: Now represents actual messages scanned by the bot (not just violations)
- **Flagged Messages**: Separated into spam and profanity categories
- **Quality Metrics**: Includes flagged rate and moderation efficiency
- **Detailed Penalties**: Comprehensive breakdown of user actions taken

#### Parameters:
- `groupId` (path, required): Telegram group/chat ID
- `period` (query, optional): Time period - `day`, `week`, `month`, `year` (default: `week`)

#### Response Example:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "period": "week",
    "dateRange": {
      "start": "2025-08-01T00:00:00.000Z",
      "end": "2025-08-08T00:00:00.000Z"
    },
    "stats": {
      "totalMessages": 1250,
      "flaggedMessages": {
        "total": 45,
        "spam": 32,
        "profanity": 13
      },
      "deletedMessages": 45,
      "penalties": {
        "mutedUsers": 5,
        "kickedUsers": 2,
        "bannedUsers": 1,
        "totalUsersActioned": 8
      },
      "qualityMetrics": {
        "averageSpamScore": 0.72,
        "flaggedRate": 3.6,
        "moderationEfficiency": {
          "messagesScanned": 1250,
          "violationsDetected": 45,
          "usersActioned": 8
        }
      },
      "topViolationTypes": [
        { "type": "SPAM", "count": 32 },
        { "type": "PROFANITY", "count": 13 }
      ]
    }
  }
}
```

### 2. User Activity Statistics

**GET** `/api/v1/webapp/group/{groupId}/users`

Returns detailed user activity statistics for group members.

#### Features:
- Messages sent per user
- Violation counts and rates
- Penalties received
- Average spam scores
- Users ranked by violations

#### Parameters:
- `groupId` (path, required): Telegram group/chat ID
- `period` (query, optional): Time period (default: `week`)
- `limit` (query, optional): Maximum users to return (default: 10, max: 100)

#### Response Example:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "period": "week",
    "users": [
      {
        "userId": "123456789",
        "username": "john_doe",
        "firstName": "John",
        "lastName": "Doe",
        "stats": {
          "messagesSent": 156,
          "violations": 3,
          "penalties": 2,
          "averageSpamScore": 0.65,
          "violationRate": 1.92
        }
      }
    ]
  }
}
```

### 3. Activity Patterns

**GET** `/api/v1/webapp/group/{groupId}/patterns`

Returns time-based activity patterns for better understanding of group dynamics.

#### Features:
- Hourly message distribution (0-23 hours)
- Daily activity trends
- Violation patterns over time
- Peak activity identification

#### Parameters:
- `groupId` (path, required): Telegram group/chat ID
- `period` (query, optional): Time period (default: `week`)

#### Response Example:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "patterns": {
      "hourlyDistribution": [
        {
          "hour": 8,
          "messages": 45,
          "violations": 2,
          "violationRate": 4.44
        },
        {
          "hour": 14,
          "messages": 78,
          "violations": 5,
          "violationRate": 6.41
        }
      ],
      "dailyActivity": [
        {
          "date": "2025-08-01",
          "messages": 234,
          "violations": 12,
          "violationRate": 5.13
        }
      ]
    }
  }
}
```

### 4. Moderation Effectiveness

**GET** `/api/v1/webapp/group/{groupId}/effectiveness`

Returns metrics to evaluate moderation system performance.

#### Features:
- Average response time to violations
- Effectiveness scoring (0-100)
- Repeat offender identification
- Response time distribution
- Performance insights

#### Parameters:
- `groupId` (path, required): Telegram group/chat ID
- `period` (query, optional): Time period (default: `week`)

#### Response Example:
```json
{
  "success": true,
  "data": {
    "groupId": "-1001234567890",
    "effectiveness": {
      "averageResponseTimeSeconds": 12.5,
      "effectivenessScore": 85,
      "totalRepeatOffenders": 3,
      "responseTimeDistribution": [
        {
          "violationType": "SPAM",
          "penaltyAction": "muted",
          "responseTimeSeconds": 8.2
        }
      ],
      "topRepeatOffenders": [
        {
          "userId": "123456789",
          "totalViolations": 5,
          "activeDays": 3,
          "averageViolationScore": 0.75
        }
      ]
    }
  }
}
```

## Enhanced Data Structures

### Log Entry Types

The enhanced logging system categorizes all activities into specific types:

#### SCANNED
- **Purpose**: Log all messages processed by the moderation system
- **Data**: Message content, spam/profanity scores, message length
- **Use Case**: Calculate total messages scanned, baseline metrics

#### VIOLATION
- **Purpose**: Log messages that violated community guidelines
- **Data**: Violation type (SPAM/PROFANITY), scores, thresholds exceeded
- **Use Case**: Track flagged content, analyze violation patterns

#### STRIKE
- **Purpose**: Log strike assignments to users
- **Data**: Strike count, violation details, classification scores
- **Use Case**: User penalty tracking, strike management

#### PENALTY
- **Purpose**: Log actions taken against users (mute, kick, ban, warn)
- **Data**: Action type, severity, executor (AUTO_MODERATOR/ADMIN)
- **Use Case**: Penalty effectiveness analysis, appeal processing

### Violation Classification

#### SPAM Detection
- **Threshold**: Configurable per group (default: 0.7)
- **Scoring**: 0.0 (clean) to 1.0 (definite spam)
- **Factors**: Promotional content, repeated patterns, external links

#### PROFANITY Detection
- **Threshold**: Configurable per group (default: 0.8)
- **Scoring**: 0.0 (no profanity) to 1.0 (severe profanity)
- **Types**: `none`, `mild`, `moderate`, `severe`

### Quality Metrics

#### Flagged Rate
```
Flagged Rate = (Flagged Messages / Total Messages) × 100
```

#### Violation Rate (per user)
```
Violation Rate = (User Violations / User Messages) × 100
```

#### Effectiveness Score
```
Effectiveness Score = max(0, 100 - (Average Response Time / 60) × 10)
```

## Backward Compatibility

The enhanced system maintains full compatibility with existing data:

- **Old Format Support**: Legacy `AUTO` type entries are automatically recognized
- **Data Migration**: No migration required - new and old formats coexist
- **Gradual Enhancement**: Statistics improve as new log entries are created

## Usage Recommendations

### For Group Administrators

1. **Monitor Flagged Rate**: Keep below 5% for healthy community
2. **Review Top Violators**: Address repeat offenders proactively
3. **Adjust Thresholds**: Use average spam scores to fine-tune detection
4. **Track Patterns**: Use hourly data to identify problematic time periods

### For Developers

1. **Caching**: Consider caching statistics for frequently accessed groups
2. **Rate Limiting**: Implement appropriate limits for analytics endpoints
3. **Data Retention**: Plan for log archival as database grows
4. **Performance**: Use date range filters to optimize query performance

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "User is not admin of this group"
  }
}
```

Common error codes:
- `ACCESS_DENIED`: User lacks admin permissions
- `GROUP_NOT_FOUND`: Invalid group ID
- `INVALID_PERIOD`: Unsupported time period
- `DATABASE_ERROR`: Internal server error

## Performance Considerations

- Statistics are computed in real-time from audit logs
- Large groups with extensive history may experience slower response times
- Consider pagination for user lists in very active groups
- Database indexing on `chatId` and `timestamp` columns is crucial

## Future Enhancements

Planned improvements include:
- Real-time statistics via WebSocket
- Custom date range selection
- Export functionality for reports
- Comparative analytics between groups
- Automated insights and recommendations
