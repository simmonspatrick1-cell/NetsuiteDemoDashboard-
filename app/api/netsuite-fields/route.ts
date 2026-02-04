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

// Cache entries keyed by type plus optional qualifiers (e.g., customerId)
const caches: Record<string, CacheEntry<unknown>> = {};

function cacheKey(base: string, qualifiers?: Record<string, string | number | undefined>) {
  if (!qualifiers) return base;
  const parts = Object.entries(qualifiers)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}`)
    .sort();
  return parts.length ? `${base}|${parts.join("&")}` : base;
}

function jitter(ms: number) {
  const delta = Math.floor(ms * 0.1); // ±10%
  return ms + (Math.random() * 2 * delta - delta);
}

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
      const key = cacheKey('unit_types');
      const cache = (caches[key] as CacheEntry<UnitType>) || { data: null, timestamp: 0 };
      if (!forceRefresh && cache.data && now - cache.timestamp < jitter(CACHE_DURATION)) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getUnitTypes();
      if (result.success && result.data) {
        const data = result.data as { unitTypes?: UnitType[] };
        const unitTypes = data.unitTypes || [];
        caches[key] = { data: unitTypes, timestamp: now } as any;
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
      const key = cacheKey('service_items');
      const cache = (caches[key] as CacheEntry<ServiceItem>) || { data: null, timestamp: 0 };
      if (!forceRefresh && cache.data && now - cache.timestamp < jitter(CACHE_DURATION)) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteServiceItems();
      if (result.success && result.data) {
        const data = result.data as { items?: ServiceItem[] };
        const items = data.items || [];
        caches[key] = { data: items, timestamp: now } as any;
        return NextResponse.json({ success: true, data: items, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch service items",
      });
    }

    case "employees": {
      const key = cacheKey('employees');
      const cache = (caches[key] as CacheEntry<Employee>) || { data: null, timestamp: 0 };
      if (!forceRefresh && cache.data && now - cache.timestamp < jitter(CACHE_DURATION)) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteEmployees();
      if (result.success && result.data) {
        const data = result.data as { employees?: Employee[] };
        const employees = data.employees || [];
        caches[key] = { data: employees, timestamp: now } as any;
        return NextResponse.json({ success: true, data: employees, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch employees",
      });
    }

    case "projects": {
      const qualifiers = customerId ? { customerId } : undefined;
      const key = cacheKey('projects', qualifiers || {});
      const cache = (caches[key] as CacheEntry<Project>) || { data: null, timestamp: 0 };
      if (!forceRefresh && cache.data && now - cache.timestamp < jitter(CACHE_DURATION)) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await (customerId ? getNetSuiteProjects(parseInt(customerId)) : getNetSuiteProjects());
      if (result.success && result.data) {
        const data = result.data as { projects?: Project[] };
        const projects = data.projects || [];
        caches[key] = { data: projects, timestamp: now } as any;
        return NextResponse.json({ success: true, data: projects, cached: false });
      }

      return NextResponse.json({
        success: false,
        data: [],
        error: result.error || "Failed to fetch projects",
      });
    }

    case "customers": {
      const key = cacheKey('customers');
      const cache = (caches[key] as CacheEntry<Customer>) || { data: null, timestamp: 0 };
      if (!forceRefresh && cache.data && now - cache.timestamp < jitter(CACHE_DURATION)) {
        return NextResponse.json({ success: true, data: cache.data, cached: true });
      }

      const result = await getNetSuiteCustomers();
      if (result.success && result.data) {
        const data = result.data as { customers?: Customer[] };
        const customers = data.customers || [];
        caches[key] = { data: customers, timestamp: now } as any;
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
