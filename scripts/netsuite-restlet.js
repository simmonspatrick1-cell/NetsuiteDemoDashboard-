/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 * 
 * Demo Data Generator RESTlet
 * Handles creating demo records for Customers, Projects, Tasks, Service Items, and Prospects
 * 
 * Deploy this script in NetSuite:
 * 1. Go to Customization > Scripting > Scripts > New
 * 2. Upload this file and create the script record
 * 3. Deploy the script and note the External URL
 * 4. Set the URL as NETSUITE_DEMO_RESTLET_URL environment variable
 */

const define = require('N/define');

define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    function post(context) {
        var response = { success: false };
        
        try {
            var action = context.action;
            var data = context.data || {};
            
            log.debug('RESTlet Called', 'Action: ' + action + ', Data: ' + JSON.stringify(data));
            
            switch(action) {
                case 'getInfo':
                    response = handleGetInfo();
                    break;
                    
                case 'createCustomer':
                    response = handleCreateCustomer(data);
                    break;
                    
                case 'createProspect':
                    response = handleCreateProspect(data);
                    break;
                    
                case 'createProject':
                    response = handleCreateProject(data);
                    break;
                    
                case 'createTask':
                    response = handleCreateTask(data);
                    break;
                    
                case 'createServiceItem':
                    response = handleCreateServiceItem(data);
                    break;
                    
                default:
                    response = { success: false, error: 'Unknown action: ' + action };
            }
            
        } catch(e) {
            log.error('RESTlet Error', e.message);
            response = { success: false, error: e.message };
        }
        
        return response;
    }
    
    function handleGetInfo() {
        return {
            success: true,
            message: 'Demo Data Generator RESTlet is running',
            version: '1.0',
            supportedActions: ['getInfo', 'createCustomer', 'createProspect', 'createProject', 'createTask', 'createServiceItem']
        };
    }
    
    function handleCreateCustomer(data) {
        var customerRecord = record.create({
            type: record.Type.CUSTOMER,
            isDynamic: true
        });
        
        customerRecord.setValue({ fieldId: 'companyname', value: data.companyName });
        customerRecord.setValue({ fieldId: 'email', value: data.email });
        
        // Set contact name if provided (uses firstname/lastname or contact sublist)
        if (data.contactName) {
            var names = data.contactName.split(' ');
            if (names.length > 1) {
                customerRecord.setValue({ fieldId: 'firstname', value: names[0] });
                customerRecord.setValue({ fieldId: 'lastname', value: names.slice(1).join(' ') });
            } else {
                customerRecord.setValue({ fieldId: 'lastname', value: data.contactName });
            }
        }
        
        var customerId = customerRecord.save();
        
        return {
            success: true,
            id: customerId.toString(),
            message: 'Customer created successfully'
        };
    }
    
    function handleCreateProspect(data) {
        var prospectRecord = record.create({
            type: record.Type.PROSPECT,
            isDynamic: true
        });
        
        prospectRecord.setValue({ fieldId: 'companyname', value: data.companyName });
        
        if (data.websiteUrl) {
            prospectRecord.setValue({ fieldId: 'url', value: data.websiteUrl });
        }
        
        // Custom fields for employees and annual revenue would need to be created in NetSuite
        // Uncomment and adjust field IDs if you have these custom fields:
        // if (data.employees) {
        //     prospectRecord.setValue({ fieldId: 'custentity_employees', value: data.employees });
        // }
        // if (data.annualRevenue) {
        //     prospectRecord.setValue({ fieldId: 'custentity_annual_revenue', value: data.annualRevenue });
        // }
        
        var prospectId = prospectRecord.save();
        
        return {
            success: true,
            id: prospectId.toString(),
            message: 'Prospect created successfully'
        };
    }
    
    function handleCreateProject(data) {
        var projectRecord = record.create({
            type: record.Type.JOB,
            isDynamic: true
        });
        
        projectRecord.setValue({ fieldId: 'companyname', value: data.projectName });
        
        // Link to parent customer if provided
        if (data.customerId) {
            projectRecord.setValue({ fieldId: 'parent', value: data.customerId });
        }
        
        // Set job status - you may need to adjust these values based on your NetSuite configuration
        // Common values: 'Awarded', 'In Progress', 'Closed'
        if (data.status) {
            // Map status to NetSuite job status field
            var statusMap = {
                'Planning': 'awarded',
                'Active': 'inProgress', 
                'On Hold': 'onHold',
                'Completed': 'closed'
            };
            var nsStatus = statusMap[data.status] || data.status;
            try {
                projectRecord.setValue({ fieldId: 'entitystatus', value: nsStatus });
            } catch(e) {
                log.debug('Status Set Failed', e.message);
            }
        }
        
        // Budget would typically go to a custom field
        // if (data.budget) {
        //     projectRecord.setValue({ fieldId: 'custentity_budget', value: data.budget });
        // }
        
        var projectId = projectRecord.save();
        
        return {
            success: true,
            id: projectId.toString(),
            message: 'Project created successfully'
        };
    }
    
    function handleCreateTask(data) {
        var taskRecord = record.create({
            type: record.Type.TASK,
            isDynamic: true
        });
        
        taskRecord.setValue({ fieldId: 'title', value: data.taskName });
        
        // Link to project/job if provided (task uses 'company' field for this)
        if (data.projectId) {
            taskRecord.setValue({ fieldId: 'company', value: data.projectId });
        }
        
        // Set assigned employee if provided - would need employee ID
        // if (data.assignedTo) {
        //     taskRecord.setValue({ fieldId: 'assigned', value: data.assignedTo });
        // }
        
        // Estimated hours - typically a custom field
        // if (data.estimatedHours) {
        //     taskRecord.setValue({ fieldId: 'custevent_estimated_hours', value: data.estimatedHours });
        // }
        
        var taskId = taskRecord.save();
        
        return {
            success: true,
            id: taskId.toString(),
            message: 'Task created successfully'
        };
    }
    
    function handleCreateServiceItem(data) {
        // Service items are typically Non-Inventory Items in NetSuite
        var itemRecord = record.create({
            type: record.Type.SERVICE_ITEM,
            isDynamic: true
        });
        
        itemRecord.setValue({ fieldId: 'itemid', value: data.itemName });
        
        if (data.description) {
            itemRecord.setValue({ fieldId: 'displayname', value: data.description });
            itemRecord.setValue({ fieldId: 'salesdescription', value: data.description });
        }
        
        // Set rate/price - this goes on the pricing sublist
        if (data.rate) {
            itemRecord.selectNewLine({ sublistId: 'price' });
            itemRecord.setCurrentSublistValue({ 
                sublistId: 'price', 
                fieldId: 'pricelevel', 
                value: 1 // Base Price level
            });
            itemRecord.setCurrentSublistValue({ 
                sublistId: 'price', 
                fieldId: 'price_1_', 
                value: data.rate 
            });
            itemRecord.commitLine({ sublistId: 'price' });
        }
        
        // Item type and rate type would typically be custom fields
        // if (data.itemType) {
        //     itemRecord.setValue({ fieldId: 'custitem_item_type', value: data.itemType });
        // }
        
        var itemId = itemRecord.save();
        
        return {
            success: true,
            id: itemId.toString(),
            message: 'Service item created successfully'
        };
    }

    return {
        post: post
    };
});
