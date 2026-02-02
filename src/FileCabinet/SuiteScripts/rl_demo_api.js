/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * Demo Data Generator RESTlet
 * Handles creating demo records for Customers, Projects, Tasks, Service Items, and Prospects
 * Also handles GET requests for fetching field values (unit types, etc.)
 *
 * Deploy this script in NetSuite:
 * 1. Go to Customization > Scripting > Scripts > New
 * 2. Upload this file and create the script record
 * 3. Deploy the script and note the External URL
 * 4. Set the URL as NETSUITE_DEMO_RESTLET_URL environment variable
 */

define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    /**
     * GET handler - fetch reference data from NetSuite
     */
    function get(context) {
        var response = { success: false };

        try {
            var action = context.action;

            log.debug('RESTlet GET Called', 'Action: ' + action);

            switch(action) {
                case 'unit_types':
                    response = handleGetUnitTypes();
                    break;

                case 'billing_types':
                    response = handleGetBillingTypes();
                    break;

                case 'expense_types':
                    response = handleGetExpenseTypes();
                    break;

                case 'templates':
                    response = handleGetTemplates();
                    break;

                case 'service_items':
                    response = handleGetServiceItems();
                    break;

                case 'employees':
                    response = handleGetEmployees();
                    break;

                case 'projects':
                    response = handleGetProjects(context.customerId);
                    break;

                case 'customers':
                    response = handleGetCustomers();
                    break;

                default:
                    response = { success: false, error: 'Unknown GET action: ' + action };
            }

        } catch(e) {
            log.error('RESTlet GET Error', e.message);
            response = { success: false, error: e.message };
        }

        return response;
    }

    /**
     * Get all unit types from NetSuite
     * Searches unitstype records and returns all unit of measure options
     */
    function handleGetUnitTypes() {
        var unitTypes = [];

        try {
            // Search for all Units Type records
            var unitTypeSearch = search.create({
                type: 'unitstype',
                columns: [
                    search.createColumn({ name: 'name' }),
                    search.createColumn({ name: 'internalid' })
                ]
            });

            unitTypeSearch.run().each(function(result) {
                var unitTypeId = result.getValue({ name: 'internalid' });
                var unitTypeName = result.getValue({ name: 'name' });

                // Load the unit type record to get individual units
                try {
                    var unitTypeRec = record.load({
                        type: 'unitstype',
                        id: unitTypeId
                    });

                    var lineCount = unitTypeRec.getLineCount({ sublistId: 'uom' });

                    for (var i = 0; i < lineCount; i++) {
                        var unitName = unitTypeRec.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'unitname',
                            line: i
                        });
                        var abbreviation = unitTypeRec.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'abbreviation',
                            line: i
                        });
                        var internalId = unitTypeRec.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'internalid',
                            line: i
                        });
                        var isBaseUnit = unitTypeRec.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'baseunit',
                            line: i
                        });

                        unitTypes.push({
                            id: internalId ? internalId.toString() : unitName,
                            name: unitName,
                            abbreviation: abbreviation,
                            unitTypeId: unitTypeId,
                            unitTypeName: unitTypeName,
                            isBaseUnit: isBaseUnit
                        });
                    }
                } catch(loadErr) {
                    log.debug('Could not load unit type', unitTypeId + ': ' + loadErr.message);
                }

                return true; // continue iteration
            });

        } catch(e) {
            log.error('Error fetching unit types', e.message);
            return { success: false, error: e.message };
        }

        return {
            success: true,
            unitTypes: unitTypes
        };
    }

    /**
     * Get billing types (placeholder - customize based on your NetSuite setup)
     */
    function handleGetBillingTypes() {
        // These would typically come from a custom list or saved search
        return {
            success: true,
            billingTypes: [
                { id: '1', name: 'Charge-Based' },
                { id: '2', name: 'Fixed-Fee' },
                { id: '3', name: 'Time and Materials' }
            ]
        };
    }

    /**
     * Get expense types (placeholder - customize based on your NetSuite setup)
     */
    function handleGetExpenseTypes() {
        return {
            success: true,
            expenseTypes: [
                { id: '1', name: 'Regular' },
                { id: '2', name: 'Reimbursable' },
                { id: '3', name: 'Non-Reimbursable' }
            ]
        };
    }

    /**
     * Get available templates
     */
    function handleGetTemplates() {
        return {
            success: true,
            templates: [
                { id: 'professional_services', name: 'Professional Services' },
                { id: 'energy', name: 'Energy' },
                { id: 'it_services', name: 'IT Services' },
                { id: 'creative', name: 'Creative' }
            ]
        };
    }

    /**
     * Get all service items from NetSuite
     */
    function handleGetServiceItems() {
        var items = [];

        try {
            var itemSearch = search.create({
                type: search.Type.SERVICE_ITEM,
                filters: [
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'itemid' }),
                    search.createColumn({ name: 'displayname' }),
                    search.createColumn({ name: 'salesdescription' }),
                    search.createColumn({ name: 'baseprice' }),
                    search.createColumn({ name: 'unitstype' })
                ]
            });

            itemSearch.run().each(function(result) {
                items.push({
                    id: result.getValue({ name: 'internalid' }),
                    itemId: result.getValue({ name: 'itemid' }),
                    displayName: result.getValue({ name: 'displayname' }),
                    description: result.getValue({ name: 'salesdescription' }),
                    basePrice: result.getValue({ name: 'baseprice' }),
                    unitsType: result.getText({ name: 'unitstype' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error fetching service items', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, items: items };
    }

    /**
     * Get all employees/resources from NetSuite
     */
    function handleGetEmployees() {
        var employees = [];

        try {
            var empSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: [
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'firstname' }),
                    search.createColumn({ name: 'lastname' }),
                    search.createColumn({ name: 'title' }),
                    search.createColumn({ name: 'department' }),
                    search.createColumn({ name: 'laborcost' })
                ]
            });

            empSearch.run().each(function(result) {
                employees.push({
                    id: result.getValue({ name: 'internalid' }),
                    entityId: result.getValue({ name: 'entityid' }),
                    firstName: result.getValue({ name: 'firstname' }),
                    lastName: result.getValue({ name: 'lastname' }),
                    name: result.getValue({ name: 'firstname' }) + ' ' + result.getValue({ name: 'lastname' }),
                    title: result.getValue({ name: 'title' }),
                    department: result.getText({ name: 'department' }),
                    laborCost: result.getValue({ name: 'laborcost' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error fetching employees', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, employees: employees };
    }

    /**
     * Get projects from NetSuite (optionally filtered by customer)
     */
    function handleGetProjects(customerId) {
        var projects = [];

        try {
            var filters = [['isinactive', 'is', 'F']];
            if (customerId) {
                filters.push('AND');
                filters.push(['parent', 'anyof', customerId]);
            }

            var projSearch = search.create({
                type: search.Type.JOB,
                filters: filters,
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'companyname' }),
                    search.createColumn({ name: 'parent' }),
                    search.createColumn({ name: 'entitystatus' }),
                    search.createColumn({ name: 'startdate' }),
                    search.createColumn({ name: 'projectedenddate' })
                ]
            });

            projSearch.run().each(function(result) {
                projects.push({
                    id: result.getValue({ name: 'internalid' }),
                    projectId: result.getValue({ name: 'entityid' }),
                    projectName: result.getValue({ name: 'companyname' }),
                    customerId: result.getValue({ name: 'parent' }),
                    customerName: result.getText({ name: 'parent' }),
                    status: result.getText({ name: 'entitystatus' }),
                    startDate: result.getValue({ name: 'startdate' }),
                    endDate: result.getValue({ name: 'projectedenddate' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error fetching projects', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, projects: projects };
    }

    /**
     * Get customers from NetSuite
     */
    function handleGetCustomers() {
        var customers = [];

        try {
            var custSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'companyname' }),
                    search.createColumn({ name: 'email' }),
                    search.createColumn({ name: 'phone' })
                ]
            });

            custSearch.run().each(function(result) {
                customers.push({
                    id: result.getValue({ name: 'internalid' }),
                    entityId: result.getValue({ name: 'entityid' }),
                    companyName: result.getValue({ name: 'companyname' }),
                    email: result.getValue({ name: 'email' }),
                    phone: result.getValue({ name: 'phone' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error fetching customers', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, customers: customers };
    }

    /**
     * POST handler - create records in NetSuite
     */
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

                case 'createEstimate':
                    response = handleCreateEstimate(data);
                    break;

                case 'createProjectTask':
                    response = handleCreateProjectTask(data);
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
            version: '3.0',
            supportedGetActions: ['unit_types', 'billing_types', 'expense_types', 'templates', 'service_items', 'employees', 'projects', 'customers'],
            supportedPostActions: ['getInfo', 'createCustomer', 'createProspect', 'createProject', 'createTask', 'createServiceItem', 'createEstimate', 'createProjectTask']
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

    /**
     * Create an Estimate with line items
     * data: {
     *   customerId: number (required),
     *   projectId: number (optional),
     *   title: string,
     *   memo: string,
     *   salesRepId: number,
     *   subsidiary: number,
     *   items: [{ itemId, quantity, rate, description, department, class, location }]
     * }
     */
    function handleCreateEstimate(data) {
        var estimateRecord = record.create({
            type: record.Type.ESTIMATE,
            isDynamic: true
        });

        // Required: Customer
        estimateRecord.setValue({ fieldId: 'entity', value: data.customerId });

        // Optional header fields
        if (data.title) {
            estimateRecord.setValue({ fieldId: 'title', value: data.title });
        }
        if (data.memo) {
            estimateRecord.setValue({ fieldId: 'memo', value: data.memo });
        }
        if (data.projectId) {
            estimateRecord.setValue({ fieldId: 'job', value: data.projectId });
        }
        if (data.salesRepId) {
            estimateRecord.setValue({ fieldId: 'salesrep', value: data.salesRepId });
        }
        if (data.subsidiary) {
            estimateRecord.setValue({ fieldId: 'subsidiary', value: data.subsidiary });
        }
        if (data.trandate) {
            estimateRecord.setValue({ fieldId: 'trandate', value: new Date(data.trandate) });
        }
        if (data.duedate) {
            estimateRecord.setValue({ fieldId: 'duedate', value: new Date(data.duedate) });
        }

        // Add line items
        if (data.items && data.items.length > 0) {
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];

                estimateRecord.selectNewLine({ sublistId: 'item' });
                estimateRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: item.itemId
                });
                estimateRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: item.quantity || 1
                });
                if (item.rate) {
                    estimateRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: item.rate
                    });
                }
                if (item.description) {
                    estimateRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        value: item.description
                    });
                }
                if (item.department) {
                    estimateRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'department',
                        value: item.department
                    });
                }
                if (item.classId) {
                    estimateRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'class',
                        value: item.classId
                    });
                }
                if (item.location) {
                    estimateRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: item.location
                    });
                }

                estimateRecord.commitLine({ sublistId: 'item' });
            }
        }

        var estimateId = estimateRecord.save();

        return {
            success: true,
            id: estimateId.toString(),
            message: 'Estimate created successfully',
            url: 'https://system.netsuite.com/app/accounting/transactions/estimate.nl?id=' + estimateId
        };
    }

    /**
     * Create a Project Task with assignees
     * data: {
     *   projectId: number (required),
     *   taskName: string (required),
     *   plannedWork: number (required, in hours),
     *   status: string,
     *   startDate: string,
     *   endDate: string,
     *   parentTaskId: number,
     *   defaultServiceItemId: number,
     *   assignees: [{ resourceId, units, plannedWork, unitCost, serviceItemId, billingClass }]
     * }
     */
    function handleCreateProjectTask(data) {
        var taskRecord = record.create({
            type: record.Type.PROJECT_TASK,
            isDynamic: true
        });

        // Required fields
        taskRecord.setValue({ fieldId: 'company', value: data.projectId });
        taskRecord.setValue({ fieldId: 'title', value: data.taskName });
        taskRecord.setValue({ fieldId: 'plannedwork', value: data.plannedWork });

        // Optional fields
        if (data.status) {
            // Status values: NOTSTART, PROGRESS, COMPLETE
            var statusMap = {
                'Not Started': 'NOTSTART',
                'In Progress': 'PROGRESS',
                'Completed': 'COMPLETE'
            };
            taskRecord.setValue({ fieldId: 'status', value: statusMap[data.status] || data.status });
        }
        if (data.startDate) {
            taskRecord.setValue({ fieldId: 'startdate', value: new Date(data.startDate) });
        }
        if (data.endDate) {
            taskRecord.setValue({ fieldId: 'enddate', value: new Date(data.endDate) });
        }
        if (data.finishByDate) {
            taskRecord.setValue({ fieldId: 'finishbydate', value: new Date(data.finishByDate) });
        }
        if (data.parentTaskId) {
            taskRecord.setValue({ fieldId: 'parent', value: data.parentTaskId });
        }
        if (data.defaultServiceItemId) {
            taskRecord.setValue({ fieldId: 'serviceitem', value: data.defaultServiceItemId });
        }
        if (data.constraintType) {
            taskRecord.setValue({ fieldId: 'constrainttype', value: data.constraintType });
        }
        if (data.nonBillable) {
            taskRecord.setValue({ fieldId: 'ismilestone', value: false });
            taskRecord.setValue({ fieldId: 'nonbillabletask', value: true });
        }

        // Add assignees
        if (data.assignees && data.assignees.length > 0) {
            for (var i = 0; i < data.assignees.length; i++) {
                var assignee = data.assignees[i];

                taskRecord.selectNewLine({ sublistId: 'assignee' });
                taskRecord.setCurrentSublistValue({
                    sublistId: 'assignee',
                    fieldId: 'resource',
                    value: assignee.resourceId
                });
                taskRecord.setCurrentSublistValue({
                    sublistId: 'assignee',
                    fieldId: 'units',
                    value: assignee.units || 100 // Default 100%
                });
                taskRecord.setCurrentSublistValue({
                    sublistId: 'assignee',
                    fieldId: 'plannedwork',
                    value: assignee.plannedWork
                });
                if (assignee.unitCost) {
                    taskRecord.setCurrentSublistValue({
                        sublistId: 'assignee',
                        fieldId: 'unitcost',
                        value: assignee.unitCost
                    });
                }
                if (assignee.serviceItemId) {
                    taskRecord.setCurrentSublistValue({
                        sublistId: 'assignee',
                        fieldId: 'serviceitem',
                        value: assignee.serviceItemId
                    });
                }
                if (assignee.billingClass) {
                    taskRecord.setCurrentSublistValue({
                        sublistId: 'assignee',
                        fieldId: 'billingclass',
                        value: assignee.billingClass
                    });
                }

                taskRecord.commitLine({ sublistId: 'assignee' });
            }
        }

        var taskId = taskRecord.save();

        return {
            success: true,
            id: taskId.toString(),
            message: 'Project task created successfully',
            url: 'https://system.netsuite.com/app/accounting/project/projecttask.nl?id=' + taskId
        };
    }

    return {
        get: get,
        post: post
    };
});
