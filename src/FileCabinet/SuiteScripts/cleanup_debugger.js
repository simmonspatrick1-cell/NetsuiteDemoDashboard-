/**
 * File Cabinet Cleanup - For SuiteScript Debugger
 *
 * HOW TO RUN:
 * 1. Go to Customization > Scripting > Script Debugger
 * 2. Set API Version to "2.1"
 * 3. Paste this entire code
 * 4. Click "Debug Script"
 * 5. Check the Execution Log for results
 */

require(['N/file', 'N/log'], function(file, log) {

    // Files to delete
    const filesToDelete = [
        // Migration Logs
        10412, 10515, 10615, 13473,
        // Empty file
        7964,
        // TypeScript duplicates
        21024, 21025, 21031, 21026,
        // Versioned duplicates
        21157, 21158, 21155, 19595,
        // Root duplicates
        22489, 22483, 21972, 21975
    ];

    let deleted = 0;
    let failed = 0;

    log.audit('CLEANUP', 'Starting deletion of ' + filesToDelete.length + ' files...');

    filesToDelete.forEach(function(fileId) {
        try {
            file.delete({ id: fileId });
            deleted++;
            log.audit('DELETED', 'File ID: ' + fileId);
        } catch (e) {
            failed++;
            log.error('FAILED', 'File ID: ' + fileId + ' - ' + e.message);
        }
    });

    log.audit('COMPLETE', 'Deleted: ' + deleted + ' | Failed: ' + failed);
});
