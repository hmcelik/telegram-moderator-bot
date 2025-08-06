import * as db from './src/common/services/database.js';

async function testAuditEndpoint() {
    try {
        // Initialize database
        await db.initializeDatabase();
        
        // Check if audit_log table exists and has data
        const tableInfo = await db.getDb().all("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log';");
        console.log('Audit log table exists:', tableInfo.length > 0);
        
        // Check total entries in audit_log
        const totalCount = await db.getDb().get("SELECT COUNT(*) as total FROM audit_log;");
        console.log('Total audit log entries:', totalCount.total);
        
        // Get sample entries
        const sampleEntries = await db.getDb().all("SELECT * FROM audit_log LIMIT 5;");
        console.log('Sample audit log entries:');
        console.log(JSON.stringify(sampleEntries, null, 2));
        
        // Check if there are any groups in the database
        const groups = await db.getDb().all("SELECT * FROM groups LIMIT 5;");
        console.log('Sample groups:');
        console.log(JSON.stringify(groups, null, 2));
        
        // Test the getAuditLog function directly
        if (groups.length > 0) {
            const groupId = groups[0].chatId;
            console.log(`\nTesting getAuditLog for group: ${groupId}`);
            const auditLogs = await db.getAuditLog(groupId, 10);
            console.log('Audit logs from getAuditLog function:');
            console.log(JSON.stringify(auditLogs, null, 2));
        }
        
    } catch (error) {
        console.error('Error testing audit endpoint:', error);
    } finally {
        process.exit(0);
    }
}

testAuditEndpoint();
