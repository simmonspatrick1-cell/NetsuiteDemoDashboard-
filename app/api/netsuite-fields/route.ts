import { NextResponse } from "next/server";
import {
  getUnitTypes,
  getNetSuiteServiceItems,
  getNetSuiteEmployees,
  getNetSuiteProjects,
  getNetSuiteCustomers,
} from "@/lib/netsuite";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Caches for various data types
interface CacheEntry<T> {
  data: T[] | null;
  timestamp: number;
}

const caches: Record<string, CacheEntry<unknown>> = {
  unit_types: { data: null, timestamp: 0 },
  service_items: { data: null, timestamp: 0 },
  employees: { data: null, timestamp: 0 },
  projects: { data: null, timestamp: 0 },
  customers: { data: null, timestamp: 0 },
};

interface UnitType {
  id: string;
  name: string;
  abbreviation?: string;
}

interface ServiceItem {
  id: string;
  itemId: string;
  displayName: string;
  description: string;
  basePrice: string;
  unitsType: string;
}

interface Employee {
  id: string;
  entityId: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  laborCost: string;
}

interface Project {
  id: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Customer {
  id: string;
  entityId: string;
  companyName: string;
  email: string;
  phone: string;
}

// Fallback unit types if NetSuite call fails
const FALLBACK_UNIT_TYPES: UnitType[] = [
  { id: "Hour", name: "Hour", abbreviation: "hr" },
  { id: "Day", name: "Day", abbreviation: "day" },
  { id: "Week", name: "Week", abbreviation: "wk" },
  { id: "Each", name: "Each", abbreviation: "ea" },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fieldType = searchParams.get("type");
  const customerId = searchParams.get("customerId");
  const forceRefresh = searchParams.get("refresh") === "true";

  const now = Date.now();

  switch (fieldType) {
    case "unit_types": {
      const cache = caches.unit_types as CacheEntry<UnitType>;
      if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getUnitTypes();
      if (result.success && result.data) {
        const data = result.data as { unitTypes?: UnitType[] };
        const unitTypes = data.unitTypes || [];
        caches.unit_types = { data: unitTypes, timestamp: now };
        return NextResponse.json({ success: true, data: unitTypes, cached: false });
      }

      return NextResponse.json({
        success: true,
        data: FALLBACK_UNIT_TYPES,
        fallback: true,
        error: result.error,
      });
    }

    case "service_items": {
      const cache = caches.service_items as CacheEntry<ServiceItem>;
      if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteServiceItems();
      if (result.success && result.data) {
        const data = result.data as { items?: ServiceItem[] };
        const items = data.items || [];
        caches.service_items = { data: items, timestamp: now };
        return NextResponse.json({ success: true, data: items, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch service items",
      });
    }

    case "employees": {
      const cache = caches.employees as CacheEntry<Employee>;
      if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteEmployees();
      if (result.success && result.data) {
        const data = result.data as { employees?: Employee[] };
        const employees = data.employees || [];
        caches.employees = { data: employees, timestamp: now };
        return NextResponse.json({ success: true, data: employees, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch employees",
      });
    }

    case "projects": {
      // Projects can be filtered by customerId, so we don't cache when filtered
      if (customerId) {
        const result = await getNetSuiteProjects(parseInt(customerId));
        if (result.success && result.data) {
          const data = result.data as { projects?: Project[] };
          return NextResponse.json({ success: true, data: data.projects || [], cached: false });
        }
        return NextResponse.json({
          success: false,
          data: [],
          error: result.error || "Failed to fetch projects",
        });
      }

      const cache = caches.projects as CacheEntry<Project>;
      if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteProjects();
      if (result.success && result.data) {
        const data = result.data as { projects?: Project[] };
        const projects = data.projects || [];
        caches.projects = { data: projects, timestamp: now };
        return NextResponse.json({ success: true, data: projects, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch projects",
      });
    }

    case "customers": {
      const cache = caches.customers as CacheEntry<Customer>;
      if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteCustomers();
      if (result.success && result.data) {
        const data = result.data as { customers?: Customer[] };
        const customers = data.customers || [];
        caches.customers = { data: customers, timestamp: now };
        return NextResponse.json({ success: true, data: customers, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch customers",
      });
    }

    default:
      return NextResponse.json(
        { error: "Invalid field type. Supported: unit_types, service_items, employees, projects, customers" },
        { status: 400 }
      );
  }
}
