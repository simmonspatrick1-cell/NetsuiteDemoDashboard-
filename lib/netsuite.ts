import crypto from "crypto";

interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
  restletUrl: string;
}

function getConfig(): NetSuiteConfig {
  const accountId = process.env.NETSUITE_ACCOUNT_ID;
  const consumerKey = process.env.NETSUITE_CONSUMER_KEY;
  const consumerSecret = process.env.NETSUITE_CONSUMER_SECRET;
  const tokenId = process.env.NETSUITE_TOKEN_ID;
  const tokenSecret = process.env.NETSUITE_TOKEN_SECRET;
  const restletUrl = process.env.NETSUITE_DEMO_RESTLET_URL;

  if (!accountId || !consumerKey || !consumerSecret || !tokenId || !tokenSecret || !restletUrl) {
    throw new Error("Missing NetSuite credentials in environment variables");
  }

  return {
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
    restletUrl,
  };
}

// RFC 5849 percent encoding
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split("?")[1];
  if (queryString) {
    const pairs = queryString.split("&");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  return params;
}

function generateSignature(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  // Get URL query parameters and merge with OAuth params
  const urlParams = parseUrlParams(url);
  const allParams = { ...urlParams, ...oauthParams };

  // Sort parameters alphabetically and create parameter string
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join("&");

  // Get base URL (without query string)
  const baseUrl = url.split("?")[0];

  // Create signature base string
  const baseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(sortedParams),
  ].join("&");

  // Create signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(baseString)
    .digest("base64");

  return signature;
}

function generateOAuthHeader(
  method: string,
  url: string,
  config: NetSuiteConfig
): string {
  const nonce = generateNonce();
  const timestamp = generateTimestamp();

  // Format account ID for realm - NetSuite expects uppercase with underscores
  // e.g., "td3049589" -> "TD3049589" or "123456_SB1" format
  const realm = config.accountId.toUpperCase().replace(/-/g, "_");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: "HMAC-SHA256",
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: "1.0",
  };

  const signature = generateSignature(
    method,
    url,
    oauthParams,
    config.consumerSecret,
    config.tokenSecret
  );

  oauthParams.oauth_signature = signature;

  // Build OAuth header - realm is NOT included in signature, only in header
  const headerParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(", ");

  return `OAuth realm="${realm}", ${headerParams}`;
}

export interface NetSuiteResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function callNetSuiteRestlet(
  method: "GET" | "POST" | "PUT" | "DELETE",
  payload?: unknown,
  queryParams?: Record<string, string>
): Promise<NetSuiteResponse> {
  try {
    const config = getConfig();
    
    // Build URL with query params for GET requests
    let url = config.restletUrl;
    if (queryParams && method === "GET") {
      const params = new URLSearchParams(queryParams);
      url = `${config.restletUrl}&${params.toString()}`;
    }
    
    const authHeader = generateOAuthHeader(method, url, config);

    const headers: HeadersInit = {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (payload && (method === "POST" || method === "PUT" || method === "DELETE")) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `NetSuite API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// GET Actions
// ============================================

export async function getTemplates() {
  return callNetSuiteRestlet("GET", undefined, { action: "templates" });
}

export async function getJobStatus(taskId: string) {
  return callNetSuiteRestlet("GET", undefined, { action: "status", taskId });
}

export async function listDemoCustomers(prefix = "Demo") {
  return callNetSuiteRestlet("GET", undefined, { action: "list_customers", prefix });
}

export async function listDemoProjects(customerId: number) {
  return callNetSuiteRestlet("GET", undefined, { action: "list_projects", customerId: customerId.toString() });
}

export async function getBillingTypes() {
  return callNetSuiteRestlet("GET", undefined, { action: "billing_types" });
}

export async function getExpenseTypes() {
  return callNetSuiteRestlet("GET", undefined, { action: "expense_types" });
}

export async function getUnitTypes() {
  return callNetSuiteRestlet("GET", undefined, { action: "unit_types" });
}

export async function getNetSuiteServiceItems() {
  return callNetSuiteRestlet("GET", undefined, { action: "service_items" });
}

export async function getNetSuiteEmployees() {
  return callNetSuiteRestlet("GET", undefined, { action: "employees" });
}

export async function getNetSuiteProjects(customerId?: number) {
  const params: Record<string, string> = { action: "projects" };
  if (customerId) {
    params.customerId = customerId.toString();
  }
  return callNetSuiteRestlet("GET", undefined, params);
}

export async function getNetSuiteCustomers() {
  return callNetSuiteRestlet("GET", undefined, { action: "customers" });
}

// ============================================
// POST Actions
// ============================================

export type TemplateType = "professional_services" | "energy" | "it_services" | "creative";
export type Industry = "professional_services" | "energy" | "it_services" | "creative";

export interface QuickSetupResult {
  success: boolean;
  message?: string;
  data?: {
    customers: Array<{ id: number; name: string; url: string }>;
    projects: Array<{ id: number; name: string; customerId: number; url: string }>;
  };
  error?: string;
}

export async function quickSetup(prospectName: string, template: TemplateType = "professional_services"): Promise<QuickSetupResult> {
  const result = await callNetSuiteRestlet("POST", {
    action: "quick_setup",
    prospectName,
    template, // Template for demo data structure, not a NetSuite field
    // Hardcoded project fields as requested
    projectStatus: "In Progress",
    projectManager: "Marc Collins",
    billingType: "Charge-Based",
    projectExpenseType: "Regular",
  });
  
  if (result.success && result.data) {
    const data = result.data as QuickSetupResult;
    return data;
  }
  
  return { success: false, error: result.error };
}

export async function createCustomer(params: {
  companyName: string;
  subsidiary?: number;
  email?: string;
  phone?: string;
}) {
  return callNetSuiteRestlet("POST", {
    action: "create_customer",
    companyName: params.companyName,
    subsidiary: params.subsidiary || 1, // Parent (Holding Co.)
    email: params.email,
    phone: params.phone,
  });
}

export async function createProject(params: {
  projectName: string;
  customerId: number;
}) {
  return callNetSuiteRestlet("POST", {
    action: "create_project",
    projectName: params.projectName,
    customerId: params.customerId,
    // Hardcoded fields as requested
    projectStatus: "In Progress",
    projectManager: "Marc Collins",
    billingType: "Charge-Based",
    projectExpenseType: "Regular",
  });
}

export async function createServiceItem(params: {
  itemName: string;
}) {
  // Add random 4-digit suffix to avoid duplicates in NetSuite
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const uniqueItemName = `${params.itemName} - ${suffix}`;
  
  return callNetSuiteRestlet("POST", {
    action: "create_service_item",
    itemName: uniqueItemName,
    displayName: uniqueItemName,
    // Hardcoded fields using internal IDs
    taxSchedule: 2, // Internal ID for S2 - Non Taxable
    subsidiary: 1, // Internal ID for Parent (Holding Co.)
    includeChildren: true,
    // Revenue Recognition / Amortization fields
    revenueRecognitionRule: 109, // Internal ID for Default One-Time Direct Posting
    revRecForecastRule: 109, // Internal ID for Default One-Time Direct Posting
    createRevenuePlansOn: null, // Leave blank
    directRevenuePosting: true,
  });
}

export async function createTimeEntry(params: {
  employeeId: number;
  projectId: number;
  hours: number;
  date?: string;
  isBillable?: boolean;
  memo?: string;
}) {
  return callNetSuiteRestlet("POST", {
    action: "create_time_entry",
    employeeId: params.employeeId,
    projectId: params.projectId,
    hours: params.hours,
    date: params.date || new Date().toISOString().split("T")[0],
    isBillable: params.isBillable ?? true,
    memo: params.memo,
  });
}

export async function batchCreate(params?: {
  template?: TemplateType;
  customerCount?: number;
  projectsPerCustomer?: number;
  daysOfTime?: number;
}) {
  return callNetSuiteRestlet("POST", {
    action: "batch_create",
    template: params?.template || "professional_services",
    customerCount: params?.customerCount || 5,
    projectsPerCustomer: params?.projectsPerCustomer || 3,
    daysOfTime: params?.daysOfTime || 30,
  });
}

export interface EstimateLineItem {
  itemId: number;
  quantity: number;
  rate?: number;
  description?: string;
  department?: number;
  classId?: number;
  location?: number;
}

export async function createEstimate(params: {
  customerId: number;
  projectId?: number;
  title?: string;
  memo?: string;
  salesRepId?: number;
  subsidiary?: number;
  trandate?: string;
  duedate?: string;
  items: EstimateLineItem[];
}) {
  return callNetSuiteRestlet("POST", {
    action: "createEstimate",
    customerId: params.customerId,
    projectId: params.projectId,
    title: params.title,
    memo: params.memo,
    salesRepId: params.salesRepId,
    subsidiary: params.subsidiary,
    trandate: params.trandate,
    duedate: params.duedate,
    items: params.items,
  });
}

export interface ProjectTaskAssignee {
  resourceId: number;
  units?: number;
  plannedWork: number;
  unitCost?: number;
  serviceItemId?: number;
  billingClass?: number;
}

export async function createProjectTask(params: {
  projectId: number;
  taskName: string;
  plannedWork: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  finishByDate?: string;
  parentTaskId?: number;
  defaultServiceItemId?: number;
  constraintType?: string;
  nonBillable?: boolean;
  assignees?: ProjectTaskAssignee[];
}) {
  return callNetSuiteRestlet("POST", {
    action: "createProjectTask",
    projectId: params.projectId,
    taskName: params.taskName,
    plannedWork: params.plannedWork,
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
    finishByDate: params.finishByDate,
    parentTaskId: params.parentTaskId,
    defaultServiceItemId: params.defaultServiceItemId,
    constraintType: params.constraintType,
    nonBillable: params.nonBillable,
    assignees: params.assignees,
  });
}

// ============================================
// DELETE Actions
// ============================================

export async function cleanupDemoData(recordType: string, prefix: string) {
  return callNetSuiteRestlet("DELETE", {
    recordType,
    prefix,
  });
}
