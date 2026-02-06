/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * Demo Data Generator RESTlet - Comprehensive Version
 * Combines features from demodashboard and NetsuiteDemoDashboard projects
 *
 * Handles:
 * - Creating demo records (Customers, Prospects, Projects, Tasks, Service Items, Estimates, Time Entries)
 * - GET requests for fetching reference data (units, employees, customers, projects)
 * - Industry-specific templates and data generation
 * - Cleanup/deletion of demo data
 *
 * Deploy this script in NetSuite:
 * 1. Go to Customization > Scripting > Scripts > New
 * 2. Upload this file and create the script record
 * 3. Deploy the script and note the External URL
 * 4. Set the URL as NETSUITE_DEMO_RESTLET_URL environment variable
 */

define(['N/record', 'N/search', 'N/query', 'N/log', 'N/format'], function(record, search, query, log, format) {

    // ============================================
    // INDUSTRY TEMPLATES & CONSTANTS
    // ============================================

    /**
     * Industry-specific project name templates
     */
    const PROJECT_TEMPLATES = {
        professional_services: [
            { name: 'Strategic Planning Initiative', type: 'fixedBid', budgetRange: [50000, 150000], tasks: ['Discovery & Assessment', 'Strategy Development', 'Roadmap Creation', 'Executive Presentation'] },
            { name: 'Organizational Assessment', type: 'timeMaterials', budgetRange: [25000, 75000], tasks: ['Stakeholder Interviews', 'Data Analysis', 'Gap Assessment', 'Recommendations Report'] },
            { name: 'Process Optimization Program', type: 'fixedBid', budgetRange: [100000, 300000], tasks: ['Current State Mapping', 'Future State Design', 'Implementation Planning', 'Change Management', 'Training & Rollout'] },
            { name: 'Digital Transformation Roadmap', type: 'timeMaterials', budgetRange: [75000, 200000], tasks: ['Technology Assessment', 'Capability Gap Analysis', 'Vendor Evaluation', 'Roadmap Development'] },
            { name: 'Change Management Support', type: 'costPlus', budgetRange: [30000, 80000], tasks: ['Stakeholder Analysis', 'Communication Planning', 'Training Development', 'Adoption Tracking'] }
        ],
        energy: [
            { name: 'Pipeline Integrity Assessment', type: 'fixedBid', budgetRange: [200000, 500000], tasks: ['Field Inspection', 'Data Collection', 'Risk Assessment', 'Remediation Planning', 'Final Report'] },
            { name: 'Regulatory Compliance Audit', type: 'timeMaterials', budgetRange: [100000, 250000], tasks: ['Documentation Review', 'Gap Analysis', 'Compliance Testing', 'Audit Report'] },
            { name: 'Environmental Impact Study', type: 'fixedBid', budgetRange: [150000, 400000], tasks: ['Baseline Assessment', 'Environmental Sampling', 'Impact Modeling', 'Mitigation Planning', 'Agency Submission'] },
            { name: 'Safety Systems Review', type: 'costPlus', budgetRange: [75000, 180000], tasks: ['Safety Audit', 'Risk Analysis', 'Recommendations', 'Implementation Support'] },
            { name: 'Asset Management Optimization', type: 'timeMaterials', budgetRange: [300000, 750000], tasks: ['Asset Inventory', 'Condition Assessment', 'Lifecycle Planning', 'Optimization Report'] }
        ],
        it_services: [
            { name: 'Cloud Migration Phase 1', type: 'fixedBid', budgetRange: [80000, 200000], tasks: ['Discovery & Assessment', 'Architecture Design', 'Migration Planning', 'Pilot Migration', 'Full Migration', 'Validation & Testing'] },
            { name: 'Security Assessment & Remediation', type: 'timeMaterials', budgetRange: [40000, 120000], tasks: ['Vulnerability Scanning', 'Penetration Testing', 'Risk Assessment', 'Remediation Implementation'] },
            { name: 'Infrastructure Modernization', type: 'fixedBid', budgetRange: [150000, 400000], tasks: ['Current State Assessment', 'Target Architecture', 'Hardware/Software Procurement', 'Implementation', 'Knowledge Transfer'] },
            { name: 'Managed Services Onboarding', type: 'costPlus', budgetRange: [25000, 60000], tasks: ['Discovery', 'Documentation', 'Tooling Setup', 'Runbook Creation', 'Transition'] },
            { name: 'Disaster Recovery Implementation', type: 'timeMaterials', budgetRange: [60000, 150000], tasks: ['Business Impact Analysis', 'DR Strategy', 'Solution Design', 'Implementation', 'Testing'] }
        ],
        creative: [
            { name: 'Brand Refresh Campaign', type: 'fixedBid', budgetRange: [30000, 80000], tasks: ['Brand Audit', 'Strategy Development', 'Visual Identity', 'Guidelines Creation', 'Asset Production'] },
            { name: 'Website Redesign', type: 'fixedBid', budgetRange: [50000, 150000], tasks: ['Discovery', 'UX Strategy', 'Design Concepts', 'Development', 'QA & Launch'] },
            { name: 'Content Strategy Retainer', type: 'timeMaterials', budgetRange: [5000, 15000], tasks: ['Monthly Planning', 'Content Creation', 'Editorial Calendar', 'Performance Reporting'] },
            { name: 'Product Launch Campaign', type: 'fixedBid', budgetRange: [75000, 200000], tasks: ['Strategy Development', 'Creative Concepts', 'Production', 'Media Planning', 'Launch Execution'] },
            { name: 'Social Media Management', type: 'costPlus', budgetRange: [3000, 10000], tasks: ['Content Calendar', 'Post Creation', 'Community Management', 'Analytics'] }
        ]
    };

    /**
     * Customer name templates by industry
     */
    const CUSTOMER_TEMPLATES = {
        professional_services: [
            'Meridian Consulting Group', 'Apex Strategic Partners', 'Catalyst Advisory',
            'Pinnacle Management Solutions', 'Horizon Business Consulting'
        ],
        energy: [
            'Frontier Energy Partners', 'Summit Pipeline Co', 'Clearwater Resources',
            'Ridgeline Energy Services', 'Northstar Petroleum'
        ],
        it_services: [
            'CloudFirst Technologies', 'DataSecure Solutions', 'NetworkPro Systems',
            'CyberShield Inc', 'TechForward Enterprises'
        ],
        creative: [
            'Spark Creative Agency', 'Blueprint Design Co', 'Narrative Studios',
            'Pixel Perfect Media', 'StoryBrand Partners'
        ]
    };

    /**
     * Employee role templates
     */
    const EMPLOYEE_ROLES = [
        { title: 'Managing Director', department: 'Leadership', billableTarget: 0.3, rate: 450 },
        { title: 'Senior Manager', department: 'Consulting', billableTarget: 0.6, rate: 350 },
        { title: 'Manager', department: 'Consulting', billableTarget: 0.7, rate: 275 },
        { title: 'Senior Consultant', department: 'Consulting', billableTarget: 0.8, rate: 225 },
        { title: 'Consultant', department: 'Consulting', billableTarget: 0.85, rate: 175 },
        { title: 'Associate', department: 'Consulting', billableTarget: 0.85, rate: 125 },
        { title: 'Analyst', department: 'Analytics', billableTarget: 0.8, rate: 150 },
        { title: 'Project Coordinator', department: 'PMO', billableTarget: 0.5, rate: 100 }
    ];

    /**
     * Service item templates for estimates
     */
    const SERVICE_ITEMS = {
        professional_services: [
            { name: 'Strategy Consulting', rate: 275, unit: 'hour' },
            { name: 'Advisory Services', rate: 250, unit: 'hour' },
            { name: 'Analysis & Research', rate: 175, unit: 'hour' },
            { name: 'Workshop Facilitation', rate: 3500, unit: 'day' },
            { name: 'Executive Presentation', rate: 5000, unit: 'each' }
        ],
        energy: [
            { name: 'Engineering Services', rate: 225, unit: 'hour' },
            { name: 'Field Inspection', rate: 195, unit: 'hour' },
            { name: 'Technical Analysis', rate: 200, unit: 'hour' },
            { name: 'Regulatory Consulting', rate: 275, unit: 'hour' },
            { name: 'Environmental Assessment', rate: 250, unit: 'hour' }
        ],
        it_services: [
            { name: 'Technical Consulting', rate: 225, unit: 'hour' },
            { name: 'Architecture Design', rate: 275, unit: 'hour' },
            { name: 'Implementation Services', rate: 200, unit: 'hour' },
            { name: 'Security Services', rate: 250, unit: 'hour' },
            { name: 'Support & Maintenance', rate: 150, unit: 'hour' }
        ],
        creative: [
            { name: 'Creative Direction', rate: 250, unit: 'hour' },
            { name: 'Design Services', rate: 175, unit: 'hour' },
            { name: 'Copywriting', rate: 150, unit: 'hour' },
            { name: 'Production Services', rate: 125, unit: 'hour' },
            { name: 'Project Management', rate: 125, unit: 'hour' }
        ]
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Generate a random number within a range
     */
    const randomInRange = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    /**
     * Generate a random date within the past N days
     */
    const randomDateInPast = (daysBack) => {
        const date = new Date();
        date.setDate(date.getDate() - randomInRange(0, daysBack));
        return date;
    };

    /**
     * Generate a future date N days from now
     */
    const futureDateFromNow = (daysForward) => {
        const date = new Date();
        date.setDate(date.getDate() + daysForward);
        return date;
    };

    /**
     * Generate a project code
     */
    const generateProjectCode = (prefix, index) => {
        const year = new Date().getFullYear().toString().slice(-2);
        const seq = String(index).padStart(3, '0');
        return `${prefix}-${year}-${seq}`;
    };

    /**
     * Get project templates for an industry
     */
    const getProjectTemplates = (industry) => {
        return PROJECT_TEMPLATES[industry] || PROJECT_TEMPLATES.professional_services;
    };

    /**
     * Get customer templates for an industry
     */
    const getCustomerTemplates = (industry) => {
        return CUSTOMER_TEMPLATES[industry] || CUSTOMER_TEMPLATES.professional_services;
    };

    /**
     * Get service items for an industry
     */
    const getServiceItems = (industry) => {
        return SERVICE_ITEMS[industry] || SERVICE_ITEMS.professional_services;
    };

    /**
     * Map billing type to NetSuite jobbillingtype value
     * All demo projects use Charge-Based (value "CB")
     */
    const mapBillingType = (billingType) => {
        return 'CB'; // Charge-Based
    };

    /**
     * Helper function to find a default service item using SuiteQL
     */
    const getDefaultServiceItemId = () => {
        try {
            const sql = `
                SELECT id
                FROM item
                WHERE itemtype = 'Service'
                  AND isinactive = 'F'
                ORDER BY id
                FETCH FIRST 1 ROWS ONLY
            `;
            const results = query.runSuiteQL({ query: sql }).asMappedResults();
            return results.length > 0 ? results[0].id : null;
        } catch (e) {
            log.debug('Get Default Service Item', 'Could not find default service item: ' + e.message);
            return null;
        }
    };

    // ============================================
    // GET HANDLER
    // ============================================

    function get(context) {
        var response = { success: false };

        try {
            var action = context.action;
            log.debug('RESTlet GET Called', 'Action: ' + action);

            switch(action) {
                // camelCase versions (primary)
                case 'unitTypes':
                    response = handleGetUnitTypes();
                    break;

                case 'billingTypes':
                    response = handleGetBillingTypes();
                    break;

                case 'expenseTypes':
                    response = handleGetExpenseTypes();
                    break;

                case 'templates':
                    response = handleGetTemplates();
                    break;

                case 'projectTemplates':
                    response = handleGetProjectTemplates(context.industry);
                    break;

                case 'customerTemplates':
                    response = handleGetCustomerTemplates(context.industry);
                    break;

                case 'serviceItemTemplates':
                    response = handleGetServiceItemTemplates(context.industry);
                    break;

                case 'employeeRoles':
                    response = handleGetEmployeeRoles();
                    break;

                case 'serviceItems':
                    response = handleGetServiceItems();
                    break;

                case 'employees':
                    response = handleGetEmployees(context.useSuiteQL === 'true');
                    break;

                case 'projects':
                    response = handleGetProjects(context.customerId);
                    break;

                case 'projectDetails':
                    response = handleGetProjectDetails(context.projectId);
                    break;

                case 'customers':
                    response = handleGetCustomers();
                    break;

                case 'listCustomers':
                    response = handleListCustomers(context.prefix);
                    break;

                case 'listProjects':
                    response = handleListProjects(context.customerId);
                    break;

                case 'jobStatus':
                    response = handleGetJobStatus(context.taskId);
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

    // ============================================
    // GET HANDLERS
    // ============================================

    function handleGetUnitTypes() {
        var unitTypes = [];

        try {
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

                try {
                    var unitTypeRec = record.load({
                        type: 'unitstype',
                        id: unitTypeId
                    });

                    var lineCount = unitTypeRec.getLineCount({ sublistId: 'uom' });

                    for (var i = 0; i < lineCount; i++) {
                        var unitName = unitTypeRec.getSublistValue({ sublistId: 'uom', fieldId: 'unitname', line: i });
                        var abbreviation = unitTypeRec.getSublistValue({ sublistId: 'uom', fieldId: 'abbreviation', line: i });
                        var internalId = unitTypeRec.getSublistValue({ sublistId: 'uom', fieldId: 'internalid', line: i });
                        var isBaseUnit = unitTypeRec.getSublistValue({ sublistId: 'uom', fieldId: 'baseunit', line: i });

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

                return true;
            });

        } catch(e) {
            log.error('Error fetching unit types', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, unitTypes: unitTypes };
    }

    function handleGetBillingTypes() {
        return {
            success: true,
            billingTypes: [
                { id: 'CB', name: 'Charge-Based' },
                { id: 'FF', name: 'Fixed-Fee' },
                { id: 'TM', name: 'Time and Materials' }
            ]
        };
    }

    function handleGetExpenseTypes() {
        return {
            success: true,
            expenseTypes: [
                { id: '-2', name: 'Regular' },
                { id: '-3', name: 'Overhead' }
            ]
        };
    }

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

    function handleGetProjectTemplates(industry) {
        return {
            success: true,
            industry: industry || 'professional_services',
            templates: getProjectTemplates(industry)
        };
    }

    function handleGetCustomerTemplates(industry) {
        return {
            success: true,
            industry: industry || 'professional_services',
            templates: getCustomerTemplates(industry)
        };
    }

    function handleGetServiceItemTemplates(industry) {
        return {
            success: true,
            industry: industry || 'professional_services',
            templates: getServiceItems(industry)
        };
    }

    function handleGetEmployeeRoles() {
        return {
            success: true,
            roles: EMPLOYEE_ROLES
        };
    }

    function handleGetServiceItems() {
        var items = [];

        try {
            var itemSearch = search.create({
                type: search.Type.SERVICE_ITEM,
                filters: [['isinactive', 'is', 'F']],
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

    function handleGetEmployees(useSuiteQL) {
        var employees = [];

        try {
            if (useSuiteQL) {
                // Use SuiteQL for potentially better performance
                const sql = `
                    SELECT id, firstname, lastname, title, email
                    FROM employee
                    WHERE isinactive = 'F'
                    ORDER BY lastname, firstname
                    FETCH FIRST 100 ROWS ONLY
                `;
                const results = query.runSuiteQL({ query: sql }).asMappedResults();
                employees = results.map(row => ({
                    id: row.id,
                    firstName: row.firstname,
                    lastName: row.lastname,
                    name: (row.firstname || '') + ' ' + (row.lastname || ''),
                    title: row.title,
                    email: row.email
                }));
            } else {
                // Use Search API
                var empSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [['isinactive', 'is', 'F']],
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
            }

        } catch(e) {
            log.error('Error fetching employees', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, employees: employees };
    }

    function handleGetProjects(customerId) {
        var projects = [];

        try {
            var filters = [['isinactive', 'is', 'F']];
            if (customerId) {
                filters.push('AND');
                filters.push(['customer', 'anyof', customerId]);
            }

            var projSearch = search.create({
                type: search.Type.JOB,
                filters: filters,
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'companyname' }),
                    search.createColumn({ name: 'customer' }),
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
                    customerId: result.getValue({ name: 'customer' }),
                    customerName: result.getText({ name: 'customer' }),
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
     * Get detailed project info using SuiteQL
     */
    function handleGetProjectDetails(projectId) {
        if (!projectId) {
            return { success: false, error: 'projectId is required' };
        }

        try {
            const sql = `
                SELECT
                    j.id,
                    j.entityid as name,
                    j.companyname,
                    j.parent as customer_id,
                    c.companyname as customer_name,
                    j.jobbillingtype as billing_type,
                    j.startdate,
                    j.enddate,
                    j.projectexpensetype
                FROM job j
                LEFT JOIN customer c ON j.parent = c.id
                WHERE j.id = ?
            `;
            const results = query.runSuiteQL({
                query: sql,
                params: [projectId]
            }).asMappedResults();

            if (results.length === 0) {
                return { success: false, error: 'Project not found' };
            }

            return { success: true, project: results[0] };

        } catch(e) {
            log.error('Error fetching project details', e.message);
            return { success: false, error: e.message };
        }
    }

    function handleGetCustomers() {
        var customers = [];

        try {
            var custSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [['isinactive', 'is', 'F']],
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
     * List customers with optional prefix filter (for demo data)
     */
    function handleListCustomers(prefix) {
        var customers = [];
        var searchPrefix = prefix || 'Demo';

        try {
            var custSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['companyname', 'startswith', searchPrefix]
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'companyname' }),
                    search.createColumn({ name: 'email' })
                ]
            });

            custSearch.run().each(function(result) {
                customers.push({
                    id: result.getValue({ name: 'internalid' }),
                    entityId: result.getValue({ name: 'entityid' }),
                    companyName: result.getValue({ name: 'companyname' }),
                    email: result.getValue({ name: 'email' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error listing customers', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, customers: customers };
    }

    /**
     * List projects for a specific customer
     */
    function handleListProjects(customerId) {
        var projects = [];

        if (!customerId) {
            return { success: false, error: 'customerId is required' };
        }

        try {
            var projSearch = search.create({
                type: search.Type.JOB,
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['parent', 'anyof', customerId]
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'entityid' }),
                    search.createColumn({ name: 'companyname' }),
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
                    status: result.getText({ name: 'entitystatus' }),
                    startDate: result.getValue({ name: 'startdate' }),
                    endDate: result.getValue({ name: 'projectedenddate' })
                });
                return true;
            });

        } catch(e) {
            log.error('Error listing projects', e.message);
            return { success: false, error: e.message };
        }

        return { success: true, projects: projects };
    }

    /**
     * Get job/task status (placeholder for async operations)
     */
    function handleGetJobStatus(taskId) {
        if (!taskId) {
            return { success: false, error: 'taskId is required' };
        }

        // This is a placeholder - could be expanded to track async batch operations
        return {
            success: true,
            taskId: taskId,
            status: 'COMPLETE',
            message: 'Task status check - no async tracking implemented'
        };
    }

    // ============================================
    // POST HANDLER
    // ============================================

    function post(context) {
        var response = { success: false };

        try {
            var action = context.action;
            var data = context.data || {};

            log.debug('RESTlet POST Called', 'Action: ' + action + ', Data keys: ' + Object.keys(data).join(', '));

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

                case 'createEstimateFromBudget':
                    response = handleCreateEstimateFromBudget(data);
                    break;

                case 'createProjectTask':
                    response = handleCreateProjectTask(data);
                    break;

                case 'createTimeEntry':
                    response = handleCreateTimeEntry(data);
                    break;

                case 'generateTimeEntries':
                    response = handleGenerateTimeEntries(data);
                    break;

                case 'cleanupDemoData':
                    response = handleCleanupDemoData(data);
                    break;

                case 'quickSetup':
                    response = handleQuickSetup(data);
                    break;

                case 'batchCreate':
                    response = handleBatchCreate(data);
                    break;

                default:
                    response = { success: false, error: 'Unknown action: ' + action };
            }

        } catch(e) {
            log.error('RESTlet POST Error', e.message);
            response = { success: false, error: e.message };
        }

        return response;
    }

    // ============================================
    // POST HANDLERS
    // ============================================

    function handleGetInfo() {
        return {
            success: true,
            message: 'Demo Data Generator RESTlet is running',
            version: '5.0',
            supportedGetActions: [
                'unitTypes', 'billingTypes', 'expenseTypes', 'templates',
                'projectTemplates', 'customerTemplates', 'serviceItemTemplates', 'employeeRoles',
                'serviceItems', 'employees', 'projects', 'projectDetails', 'customers',
                'listCustomers', 'listProjects', 'jobStatus'
            ],
            supportedPostActions: [
                'getInfo', 'createCustomer', 'createProspect', 'createProject', 'createTask',
                'createServiceItem', 'createEstimate', 'createEstimateFromBudget', 'createProjectTask',
                'createTimeEntry', 'generateTimeEntries', 'cleanupDemoData', 'quickSetup', 'batchCreate'
            ]
        };
    }

    function handleCreateCustomer(data) {
        var customerRecord = record.create({
            type: record.Type.CUSTOMER,
            isDynamic: true
        });

        customerRecord.setValue({ fieldId: 'companyname', value: data.companyName });

        if (data.email) {
            customerRecord.setValue({ fieldId: 'email', value: data.email });
        }

        if (data.subsidiary) {
            customerRecord.setValue({ fieldId: 'subsidiary', value: data.subsidiary });
        }

        if (data.contactName) {
            var names = data.contactName.split(' ');
            if (names.length > 1) {
                customerRecord.setValue({ fieldId: 'firstname', value: names[0] });
                customerRecord.setValue({ fieldId: 'lastname', value: names.slice(1).join(' ') });
            } else {
                customerRecord.setValue({ fieldId: 'lastname', value: data.contactName });
            }
        }

        // Set industry custom field if exists
        if (data.industry) {
            try {
                customerRecord.setValue({ fieldId: 'custentity_industry', value: data.industry });
            } catch (e) {
                log.debug('Industry field not available', e.message);
            }
        }

        var customerId = customerRecord.save();

        log.audit('Customer Created', 'ID: ' + customerId + ', Name: ' + data.companyName);

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

        if (data.subsidiary) {
            prospectRecord.setValue({ fieldId: 'subsidiary', value: data.subsidiary });
        }

        if (data.email) {
            prospectRecord.setValue({ fieldId: 'email', value: data.email });
        }

        var prospectId = prospectRecord.save();

        log.audit('Prospect Created', 'ID: ' + prospectId + ', Name: ' + data.companyName);

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

        if (data.customerId) {
            projectRecord.setValue({ fieldId: 'parent', value: data.customerId });
        }

        // Set billing type - default to Charge-Based
        projectRecord.setValue({ fieldId: 'jobbillingtype', value: mapBillingType(data.billingType) });

        // Set Project Expense Type (required in some accounts)
        try {
            projectRecord.setValue({ fieldId: 'projectexpensetype', value: data.expenseType || -2 });
        } catch(e) {
            log.debug('Could not set Project Expense Type', e.message);
        }

        if (data.status) {
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

        if (data.startDate) {
            projectRecord.setValue({ fieldId: 'startdate', value: new Date(data.startDate) });
        }

        if (data.endDate) {
            projectRecord.setValue({ fieldId: 'enddate', value: new Date(data.endDate) });
        }

        // Set budget via custom field
        if (data.budget) {
            try {
                projectRecord.setValue({ fieldId: 'custentity_project_budget', value: data.budget });
            } catch(e) {
                log.debug('Budget field not available', e.message);
            }
        }

        // Set project code
        if (data.projectCode) {
            try {
                projectRecord.setValue({ fieldId: 'custentity_project_code', value: data.projectCode });
            } catch(e) {
                log.debug('Project code field not available', e.message);
            }
        }

        var projectId = projectRecord.save();

        log.audit('Project Created', 'ID: ' + projectId + ', Name: ' + data.projectName);

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

        if (data.projectId) {
            taskRecord.setValue({ fieldId: 'company', value: data.projectId });
        }

        if (data.assignedTo) {
            taskRecord.setValue({ fieldId: 'assigned', value: data.assignedTo });
        }

        if (data.startDate) {
            taskRecord.setValue({ fieldId: 'startdate', value: new Date(data.startDate) });
        }

        if (data.dueDate) {
            taskRecord.setValue({ fieldId: 'duedate', value: new Date(data.dueDate) });
        }

        var taskId = taskRecord.save();

        return {
            success: true,
            id: taskId.toString(),
            message: 'Task created successfully'
        };
    }

    function handleCreateServiceItem(data) {
        var itemRecord = record.create({
            type: record.Type.SERVICE_ITEM,
            isDynamic: true
        });

        itemRecord.setValue({ fieldId: 'itemid', value: data.itemName });

        // Display name / description
        var displayName = data.displayName || data.description;
        if (displayName) {
            itemRecord.setValue({ fieldId: 'displayname', value: displayName });
            itemRecord.setValue({ fieldId: 'salesdescription', value: displayName });
        }

        // Subsidiary
        if (data.subsidiary) {
            itemRecord.setValue({ fieldId: 'subsidiary', value: data.subsidiary });
        }
        if (data.includeChildren) {
            itemRecord.setValue({ fieldId: 'includechildren', value: true });
        }

        // Tax Schedule (required in this account)
        if (data.taxSchedule) {
            itemRecord.setValue({ fieldId: 'taxschedule', value: data.taxSchedule });
        }

        // Unit type
        if (data.unitType) {
            itemRecord.setValue({ fieldId: 'unitstype', value: data.unitType });
        }

        // Revenue Recognition
        if (data.revenueRecognitionRule) {
            itemRecord.setValue({ fieldId: 'revenuerecognitionrule', value: data.revenueRecognitionRule });
        }
        if (data.revRecForecastRule) {
            itemRecord.setValue({ fieldId: 'revrecforecastrule', value: data.revRecForecastRule });
        }
        if (data.directRevenuePosting) {
            itemRecord.setValue({ fieldId: 'directrevenueposting', value: true });
        }

        var itemId = itemRecord.save();

        // Set pricing after initial save (sublist not available in dynamic create with subsidiaries)
        var price = data.salesPrice || data.rate;
        if (price) {
            try {
                var loadedRecord = record.load({ type: record.Type.SERVICE_ITEM, id: itemId, isDynamic: true });
                var lineCount = loadedRecord.getLineCount({ sublistId: 'price' });
                if (lineCount > 0) {
                    loadedRecord.selectLine({ sublistId: 'price', line: 0 });
                    loadedRecord.setCurrentSublistValue({ sublistId: 'price', fieldId: 'price_1_', value: price });
                    loadedRecord.commitLine({ sublistId: 'price' });
                    loadedRecord.save();
                }
            } catch (priceErr) {
                log.error('Set price failed', priceErr);
            }
        }

        return {
            success: true,
            id: itemId.toString(),
            message: 'Service item created successfully'
        };
    }

    /**
     * Create an Estimate with explicit line items
     */
    function handleCreateEstimate(data) {
        var estimateRecord = record.create({
            type: record.Type.ESTIMATE,
            isDynamic: true
        });

        estimateRecord.setValue({ fieldId: 'entity', value: data.customerId });

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

        if (data.items && data.items.length > 0) {
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];

                estimateRecord.selectNewLine({ sublistId: 'item' });
                estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: item.itemId });
                estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: item.quantity || 1 });

                if (item.rate) {
                    estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: item.rate });
                }
                if (item.description) {
                    estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: item.description });
                }
                if (item.department) {
                    estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: item.department });
                }
                if (item.classId) {
                    estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: item.classId });
                }
                if (item.location) {
                    estimateRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: item.location });
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
     * Create an Estimate from budget with automatic line item generation
     */
    function handleCreateEstimateFromBudget(data) {
        const { projectId, customerId, budget, industry, phases, tranDate, dueDate, memo, serviceItemId } = data;

        if (!projectId || !customerId || !budget) {
            return { success: false, error: 'projectId, customerId, and budget are required' };
        }

        try {
            const estimate = record.create({
                type: record.Type.ESTIMATE,
                isDynamic: true
            });

            estimate.setValue({ fieldId: 'entity', value: customerId });
            estimate.setValue({ fieldId: 'job', value: projectId });

            const transactionDate = tranDate ? new Date(tranDate) : new Date();
            estimate.setValue({ fieldId: 'trandate', value: transactionDate });

            if (dueDate) {
                estimate.setValue({ fieldId: 'duedate', value: new Date(dueDate) });
            } else {
                const defaultDueDate = new Date(transactionDate);
                defaultDueDate.setDate(defaultDueDate.getDate() + 30);
                estimate.setValue({ fieldId: 'duedate', value: defaultDueDate });
            }

            if (memo) {
                estimate.setValue({ fieldId: 'memo', value: memo });
            }

            // Get service items for the industry
            const serviceItems = getServiceItems(industry || 'professional_services');

            // Build line items
            let lineItems = [];
            let phaseList = phases && phases.length > 0 ? phases : [
                'Discovery & Planning',
                'Analysis & Design',
                'Implementation',
                'Testing & QA',
                'Training & Documentation'
            ].slice(0, randomInRange(3, 5));

            const budgetPerPhase = budget / phaseList.length;

            phaseList.forEach((phase, index) => {
                const serviceItem = serviceItems[index % serviceItems.length];
                const rate = serviceItem.rate;
                const quantity = Math.round(budgetPerPhase / rate);

                lineItems.push({
                    description: phase,
                    rate: rate,
                    quantity: quantity,
                    amount: quantity * rate
                });
            });

            // Add line items to estimate
            const defaultServiceItemId = serviceItemId || getDefaultServiceItemId();

            lineItems.forEach((item) => {
                estimate.selectNewLine({ sublistId: 'item' });

                if (defaultServiceItemId) {
                    estimate.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: defaultServiceItemId });
                }

                estimate.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: item.description });
                estimate.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: item.quantity });
                estimate.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: item.rate });

                try {
                    estimate.setCurrentSublistValue({ sublistId: 'item', fieldId: 'job', value: projectId });
                } catch(e) {
                    // Job field on line may not be enabled
                }

                estimate.commitLine({ sublistId: 'item' });
            });

            const estimateId = estimate.save();

            log.audit('Estimate Created from Budget', 'ID: ' + estimateId + ', Project: ' + projectId + ', Budget: ' + budget);

            return {
                success: true,
                id: estimateId.toString(),
                projectId: projectId,
                customerId: customerId,
                totalAmount: lineItems.reduce((sum, item) => sum + item.amount, 0),
                lineItems: lineItems,
                url: 'https://system.netsuite.com/app/accounting/transactions/estimate.nl?id=' + estimateId
            };

        } catch(e) {
            log.error('Create Estimate from Budget Error', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Create a Project Task with assignees
     */
    function handleCreateProjectTask(data) {
        var taskRecord = record.create({
            type: record.Type.PROJECT_TASK,
            isDynamic: true
        });

        taskRecord.setValue({ fieldId: 'company', value: data.projectId });
        taskRecord.setValue({ fieldId: 'title', value: data.taskName });
        taskRecord.setValue({ fieldId: 'plannedwork', value: data.plannedWork });

        if (data.status) {
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

        if (data.assignees && data.assignees.length > 0) {
            for (var i = 0; i < data.assignees.length; i++) {
                var assignee = data.assignees[i];

                taskRecord.selectNewLine({ sublistId: 'assignee' });
                taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'resource', value: assignee.resourceId });
                taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'units', value: assignee.units || 100 });
                taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'plannedwork', value: assignee.plannedWork });

                if (assignee.unitCost) {
                    taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'unitcost', value: assignee.unitCost });
                }
                if (assignee.serviceItemId) {
                    taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'serviceitem', value: assignee.serviceItemId });
                }
                if (assignee.billingClass) {
                    taskRecord.setCurrentSublistValue({ sublistId: 'assignee', fieldId: 'billingclass', value: assignee.billingClass });
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

    /**
     * Create a single time entry
     */
    function handleCreateTimeEntry(data) {
        const { employeeId, projectId, hours, date, isBillable, memo } = data;

        if (!employeeId || !projectId || !hours) {
            return { success: false, error: 'employeeId, projectId, and hours are required' };
        }

        try {
            const timeEntry = record.create({
                type: record.Type.TIME_BILL,
                isDynamic: true
            });

            timeEntry.setValue({ fieldId: 'employee', value: employeeId });
            timeEntry.setValue({ fieldId: 'customer', value: projectId });
            timeEntry.setValue({ fieldId: 'hours', value: hours });
            timeEntry.setValue({ fieldId: 'trandate', value: date ? new Date(date) : new Date() });
            timeEntry.setValue({ fieldId: 'isbillable', value: isBillable !== false });

            if (data.serviceItemId) {
                timeEntry.setValue({ fieldId: 'item', value: data.serviceItemId });
            }

            if (memo) {
                timeEntry.setValue({ fieldId: 'memo', value: memo });
            }

            const timeEntryId = timeEntry.save();

            return {
                success: true,
                id: timeEntryId.toString(),
                message: 'Time entry created successfully'
            };

        } catch(e) {
            log.error('Create Time Entry Error', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Generate multiple time entries for a project
     */
    function handleGenerateTimeEntries(data) {
        const { projectId, employeeIds, daysBack, avgHoursPerDay, billableRatio } = data;

        if (!projectId || !employeeIds || employeeIds.length === 0) {
            return { success: false, error: 'projectId and employeeIds are required' };
        }

        const timeEntryIds = [];
        const days = daysBack || 30;
        const today = new Date();

        try {
            for (let day = 0; day < days; day++) {
                const entryDate = new Date(today);
                entryDate.setDate(today.getDate() - day);

                // Skip weekends
                if (entryDate.getDay() === 0 || entryDate.getDay() === 6) continue;

                // Random subset of employees work on this project each day
                const workingEmployees = employeeIds.filter(() => Math.random() > 0.3);

                for (const employeeId of workingEmployees) {
                    const hours = randomInRange(4, 10);
                    const isBillable = Math.random() < (billableRatio || 0.8);

                    try {
                        const timeEntry = record.create({
                            type: record.Type.TIME_BILL,
                            isDynamic: true
                        });

                        timeEntry.setValue({ fieldId: 'employee', value: employeeId });
                        timeEntry.setValue({ fieldId: 'customer', value: projectId });
                        timeEntry.setValue({ fieldId: 'hours', value: hours });
                        timeEntry.setValue({ fieldId: 'trandate', value: entryDate });
                        timeEntry.setValue({ fieldId: 'isbillable', value: isBillable });
                        timeEntry.setValue({ fieldId: 'memo', value: 'Work on ' + entryDate.toISOString().slice(0, 10) });

                        const id = timeEntry.save();
                        timeEntryIds.push(id);
                    } catch(e) {
                        log.debug('Time entry creation failed', e.message);
                    }
                }
            }

            log.audit('Time Entries Generated', 'Project: ' + projectId + ', Count: ' + timeEntryIds.length);

            return {
                success: true,
                count: timeEntryIds.length,
                ids: timeEntryIds,
                message: 'Generated ' + timeEntryIds.length + ' time entries'
            };

        } catch(e) {
            log.error('Generate Time Entries Error', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Quick setup - creates a customer and project for demo
     */
    function handleQuickSetup(data) {
        const { prospectName, template, projectStatus, projectManager, billingType, projectExpenseType } = data;

        if (!prospectName) {
            return { success: false, error: 'prospectName is required' };
        }

        const industry = template || 'professional_services';
        const customers = [];
        const projects = [];

        try {
            // Create customer
            const customerRecord = record.create({
                type: record.Type.CUSTOMER,
                isDynamic: true
            });

            const customerName = prospectName + ' - Demo';
            customerRecord.setValue({ fieldId: 'companyname', value: customerName });
            customerRecord.setValue({ fieldId: 'subsidiary', value: 1 });

            const customerId = customerRecord.save();
            customers.push({
                id: customerId,
                name: customerName,
                url: 'https://system.netsuite.com/app/common/entity/custjob.nl?id=' + customerId
            });

            // Get project templates for the industry
            const projectTemplates = getProjectTemplates(industry);
            const selectedTemplates = projectTemplates.slice(0, 3); // Create 3 projects

            for (let i = 0; i < selectedTemplates.length; i++) {
                const template = selectedTemplates[i];

                const projectRecord = record.create({
                    type: record.Type.JOB,
                    isDynamic: true
                });

                const projectName = prospectName + ' - ' + template.name;
                projectRecord.setValue({ fieldId: 'companyname', value: projectName });
                projectRecord.setValue({ fieldId: 'parent', value: customerId });
                projectRecord.setValue({ fieldId: 'jobbillingtype', value: 'CB' });

                try {
                    projectRecord.setValue({ fieldId: 'projectexpensetype', value: -2 });
                } catch(e) {
                    log.debug('Could not set project expense type', e.message);
                }

                const projectId = projectRecord.save();
                projects.push({
                    id: projectId,
                    name: projectName,
                    customerId: customerId,
                    url: 'https://system.netsuite.com/app/accounting/project/project.nl?id=' + projectId
                });
            }

            log.audit('Quick Setup Complete', 'Customer: ' + customerId + ', Projects: ' + projects.length);

            return {
                success: true,
                message: 'Quick setup completed successfully',
                data: {
                    customers: customers,
                    projects: projects
                }
            };

        } catch(e) {
            log.error('Quick Setup Error', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Batch create demo data
     */
    function handleBatchCreate(data) {
        const { template, customerCount, projectsPerCustomer, daysOfTime } = data;

        const industry = template || 'professional_services';
        const numCustomers = customerCount || 5;
        const numProjects = projectsPerCustomer || 3;
        const numDays = daysOfTime || 30;

        const createdCustomers = [];
        const createdProjects = [];

        try {
            const customerTemplates = getCustomerTemplates(industry);
            const projectTemplates = getProjectTemplates(industry);

            for (let c = 0; c < numCustomers; c++) {
                // Create customer
                const customerRecord = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });

                const baseName = customerTemplates[c % customerTemplates.length];
                const customerName = 'Demo - ' + baseName + ' ' + (c + 1);
                customerRecord.setValue({ fieldId: 'companyname', value: customerName });
                customerRecord.setValue({ fieldId: 'subsidiary', value: 1 });

                const customerId = customerRecord.save();
                createdCustomers.push({ id: customerId, name: customerName });

                // Create projects for this customer
                for (let p = 0; p < numProjects; p++) {
                    const projectTemplate = projectTemplates[p % projectTemplates.length];

                    const projectRecord = record.create({
                        type: record.Type.JOB,
                        isDynamic: true
                    });

                    const projectName = customerName + ' - ' + projectTemplate.name;
                    projectRecord.setValue({ fieldId: 'companyname', value: projectName });
                    projectRecord.setValue({ fieldId: 'parent', value: customerId });
                    projectRecord.setValue({ fieldId: 'jobbillingtype', value: 'CB' });

                    try {
                        projectRecord.setValue({ fieldId: 'projectexpensetype', value: -2 });
                    } catch(e) {
                        // Field may not be available
                    }

                    const projectId = projectRecord.save();
                    createdProjects.push({ id: projectId, name: projectName, customerId: customerId });
                }
            }

            log.audit('Batch Create Complete', 'Customers: ' + createdCustomers.length + ', Projects: ' + createdProjects.length);

            return {
                success: true,
                message: 'Batch create completed',
                customersCreated: createdCustomers.length,
                projectsCreated: createdProjects.length,
                customers: createdCustomers,
                projects: createdProjects
            };

        } catch(e) {
            log.error('Batch Create Error', e.message);
            return { success: false, error: e.message };
        }
    }

    /**
     * Delete demo data by external ID prefix
     */
    function handleCleanupDemoData(data) {
        const { recordType, prefix } = data;

        if (!recordType || !prefix) {
            return { success: false, error: 'recordType and prefix are required' };
        }

        let deleteCount = 0;

        try {
            const sql = `
                SELECT id, externalid
                FROM ${recordType}
                WHERE externalid LIKE '${prefix}%'
            `;

            const results = query.runSuiteQL({ query: sql }).asMappedResults();

            for (const row of results) {
                try {
                    record.delete({
                        type: recordType,
                        id: row.id
                    });
                    deleteCount++;
                } catch(e) {
                    log.error('Delete Record Error', 'Type: ' + recordType + ', ID: ' + row.id + ': ' + e.message);
                }
            }

            log.audit('Cleanup Complete', 'Type: ' + recordType + ', Deleted: ' + deleteCount);

            return {
                success: true,
                deletedCount: deleteCount,
                message: 'Deleted ' + deleteCount + ' records'
            };

        } catch(e) {
            log.error('Cleanup Demo Data Error', e.message);
            return { success: false, error: e.message };
        }
    }

    // ============================================
    // EXPORTS
    // ============================================

    return {
        get: get,
        post: post
    };
});
