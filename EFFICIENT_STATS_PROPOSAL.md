# Efficient Message Statistics Proposal

## Current Problem
The system currently logs **every single scanned message** to the `audit_log` table, which:
- Wastes enormous database space
- Creates unnecessary I/O overhead
- Makes queries slower over time
- Stores redundant data (most messages are clean)

## Proposed Solution: Message Counter Table

Instead of logging every message, implement a counter-based approach:

### New Database Schema
```sql
CREATE TABLE IF NOT EXISTS message_stats (
    chatId TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD format
    hour INTEGER NOT NULL, -- 0-23
    messages_scanned INTEGER DEFAULT 0,
    spam_detected INTEGER DEFAULT 0,
    profanity_detected INTEGER DEFAULT 0,
    messages_deleted INTEGER DEFAULT 0,
    PRIMARY KEY (chatId, date, hour)
);
```

### Storage Strategy
1. **Increment counters** for each message processed
2. **Only log violations and actions** in audit_log
3. **Aggregate hourly/daily** for efficient queries
4. **Purge old counters** after retention period

### Example Implementation
```javascript
// Instead of logging every message
export const incrementMessageCounter = async (chatId, type = 'scanned') => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    const field = type === 'spam' ? 'spam_detected' : 
                  type === 'profanity' ? 'profanity_detected' :
                  type === 'deleted' ? 'messages_deleted' : 'messages_scanned';
    
    await db.run(`
        INSERT INTO message_stats (chatId, date, hour, ${field}) 
        VALUES (?, ?, ?, 1)
        ON CONFLICT(chatId, date, hour) 
        DO UPDATE SET ${field} = ${field} + 1
    `, chatId, date, hour);
};

// Efficient stats query
export const getGroupStatsEfficient = async (groupId, startDate, endDate) => {
    const stats = await db.get(`
        SELECT 
            SUM(messages_scanned) as totalMessages,
            SUM(spam_detected) as spamCount,
            SUM(profanity_detected) as profanityCount,
            SUM(messages_deleted) as deletedCount
        FROM message_stats 
        WHERE chatId = ? AND date BETWEEN ? AND ?
    `, groupId, startDate, endDate);
    
    // Still get detailed actions from audit_log for penalties
    const penalties = await db.all(`...`); // Only violation/penalty entries
    
    return {
        totalMessages: stats.totalMessages || 0,
        flaggedMessages: {
            total: (stats.spamCount || 0) + (stats.profanityCount || 0),
            spam: stats.spamCount || 0,
            profanity: stats.profanityCount || 0
        },
        deletedMessages: stats.deletedCount || 0,
        // ... other stats from penalties query
    };
};
```

### Storage Comparison
**Current approach (per 1000 messages):**
- 1000 audit_log entries × ~500 bytes = ~500KB
- Only ~50 violations actually matter

**Proposed approach:**
- 24 counter entries × ~100 bytes = ~2.4KB (99.5% reduction!)
- Same 50 violation entries in audit_log
- **Total: ~27KB vs 500KB** 

### Migration Strategy
1. **Phase 1**: Add counter table, dual-write for testing
2. **Phase 2**: Switch stats queries to counter table
3. **Phase 3**: Remove SCANNED entries from audit_log
4. **Phase 4**: Cleanup existing SCANNED entries (optional)

### Benefits
- ✅ **99%+ storage reduction** for message statistics
- ✅ **Much faster queries** (aggregate 24 rows vs 1000s)
- ✅ **Better performance** under high message load
- ✅ **Easy time-based analytics** (hourly/daily patterns)
- ✅ **Automatic data aging** (delete old counter rows)
- ✅ **Preserves detailed logs** for actual violations/actions

### Legacy Compatibility
Your current legacy data will work fine because:
- It only contains violation/action entries (not scanned messages)
- New counter table handles message volume statistics
- Existing audit_log queries for violations remain unchanged

This approach gives you accurate statistics without the storage waste!
