/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 *
 * File Cabinet Cleanup Script
 * Deletes specified files from the File Cabinet
 *
 * HOW TO RUN:
 * Option 1: Script Debugger (Quick)
 *   1. Go to Customization > Scripting > Script Debugger
 *   2. Paste this code and click "Debug Script"
 *
 * Option 2: Deploy as Scheduled Script
 *   1. Upload this file to File Cabinet
 *   2. Create Script record (Customization > Scripting > Scripts > New)
 *   3. Deploy and run manually
 */

define(['N/file', 'N/log'], function(file, log) {

    // Files to delete - Moderate Cleanup Plan
    const FILES_TO_DELETE = [
        // Migration Logs
        { id: 10412, name: 'FILTER_MIGRATION_LOG_2021_4_21_1', reason: 'Old migration log' },
        { id: 10515, name: 'FILTER_MIGRATION_LOG_2021_8_11_1', reason: 'Old migration log' },
        { id: 10615, name: 'FILTER_MIGRATION_LOG_2022_1_16_1', reason: 'Old migration log' },
        { id: 13473, name: 'FILTER_MIGRATION_LOG_2022_4_5_1', reason: 'Old migration log' },

        // Empty/Near-empty files
        { id: 7964, name: 'Mass Update.js', reason: 'Nearly empty file' },

        // TypeScript duplicates (keeping .js versions)
        { id: 21024, name: 'ProjectAPI.ts', reason: 'TypeScript duplicate' },
        { id: 21025, name: 'ProjectViewer.ts', reason: 'TypeScript duplicate' },
        { id: 21031, name: 'ProjectViewerSimple.ts', reason: 'TypeScript duplicate' },
        { id: 21026, name: 'HelloWorld.ts', reason: 'TypeScript duplicate' },

        // Versioned duplicates (keeping latest/fixed versions)
        { id: 21157, name: 'prj1224_resource_allocation_ACTUAL.js', reason: 'Older version - keeping (2).js' },
        { id: 21158, name: 'prj1224_resource_allocation_ACTUAL (1).js', reason: 'Older version - keeping (2).js' },
        { id: 21155, name: 'prj1224_resource_assignment.js', reason: 'Non-fixed version' },
        { id: 19595, name: 'tnc_create_subs.js', reason: 'Older version - keeping (1).js' },

        // Root-level duplicates of demo-tools files
        { id: 22489, name: 'demo_utils.js (root)', reason: 'Duplicate of demo-tools version' },
        { id: 22483, name: 'rl_demo_api.js (root)', reason: 'Duplicate of demo-tools version' },
        { id: 21972, name: 'netsuite-restlet.js', reason: 'Superseded by rl_demo_api.js' },
        { id: 21975, name: 'EmailProcessor.suite-script.js (root)', reason: 'Older duplicate of demo-tools version' }
    ];

    function execute(context) {
        log.audit('Cleanup Started', 'Attempting to delete ' + FILES_TO_DELETE.length + ' files');

        let deleted = 0;
        let failed = 0;
        const results = [];

        for (const fileInfo of FILES_TO_DELETE) {
            try {
                file.delete({ id: fileInfo.id });
                deleted++;
                results.push({
                    id: fileInfo.id,
                    name: fileInfo.name,
                    status: 'DELETED',
                    reason: fileInfo.reason
                });
                log.audit('File Deleted', 'ID: ' + fileInfo.id + ' - ' + fileInfo.name);
            } catch (e) {
                failed++;
                results.push({
                    id: fileInfo.id,
                    name: fileInfo.name,
                    status: 'FAILED',
                    error: e.message
                });
                log.error('Delete Failed', 'ID: ' + fileInfo.id + ' - ' + fileInfo.name + ': ' + e.message);
            }
        }

        log.audit('Cleanup Complete', 'Deleted: ' + deleted + ', Failed: ' + failed);

        return {
            deleted: deleted,
            failed: failed,
            results: results
        };
    }

    return {
        execute: execute
    };
});
