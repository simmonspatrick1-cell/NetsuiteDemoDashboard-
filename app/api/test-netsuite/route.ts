import { NextResponse } from "next/server";
import { getTemplates, listDemoCustomers, getBillingTypes } from "@/lib/netsuite";

export async function GET() {
  try {
    // Test connection by getting templates (a read-only action)
    const [templatesResult, customersResult, billingTypesResult] = await Promise.all([
      getTemplates(),
      listDemoCustomers(),
      getBillingTypes(),
    ]);

    return NextResponse.json({
      success: templatesResult.success && customersResult.success && billingTypesResult.success,
      message: templatesResult.success && customersResult.success && billingTypesResult.success ? "NetSuite connection successful" : "NetSuite connection failed",
      response: {
        templates: templatesResult.data,
        customers: customersResult.data,
        billingTypes: billingTypesResult.data,
      },
      error: {
        templates: templatesResult.error,
        customers: customersResult.error,
        billingTypes: billingTypesResult.error,
      },
      config: {
        accountId: process.env.NETSUITE_ACCOUNT_ID ? "Set" : "Missing",
        consumerKey: process.env.NETSUITE_CONSUMER_KEY ? "Set" : "Missing",
        consumerSecret: process.env.NETSUITE_CONSUMER_SECRET ? "Set" : "Missing",
        tokenId: process.env.NETSUITE_TOKEN_ID ? "Set" : "Missing",
        tokenSecret: process.env.NETSUITE_TOKEN_SECRET ? "Set" : "Missing",
        restletUrl: process.env.NETSUITE_DEMO_RESTLET_URL || "Missing",
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      config: {
        accountId: process.env.NETSUITE_ACCOUNT_ID ? "Set" : "Missing",
        consumerKey: process.env.NETSUITE_CONSUMER_KEY ? "Set" : "Missing",
        consumerSecret: process.env.NETSUITE_CONSUMER_SECRET ? "Set" : "Missing",
        tokenId: process.env.NETSUITE_TOKEN_ID ? "Set" : "Missing",
        tokenSecret: process.env.NETSUITE_TOKEN_SECRET ? "Set" : "Missing",
        restletUrl: process.env.NETSUITE_DEMO_RESTLET_URL || "Missing",
      },
    });
  }
}
