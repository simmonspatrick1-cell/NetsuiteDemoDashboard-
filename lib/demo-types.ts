export interface Prospect {
  id: number;
  company_name: string;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  subsidiary: string | null;
  status: string | null;
  created_at: Date;
}

export interface Customer {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  subsidiary: string | null;
  status: string | null;
  prospect_id: number | null;
  netsuite_id: string | null;
  selected: boolean;
  created_at: Date;
}

export interface ServiceItem {
  id: number;
  item_name: string;
  item_type: string;
  description: string | null;
  rate: number;
  rate_type: string;
  prospect_id: number | null;
  netsuite_id: string | null;
  selected: boolean;
  created_at: Date;
}

export interface Project {
  id: number;
  project_id: string | null; // NetSuite Project ID like PRJ1242
  project_name: string;
  customer_id: number | null;
  subsidiary: string | null;
  project_status: string | null;
  project_manager: string | null;
  scheduling_method: string | null; // Forward
  start_date: Date | null;
  calculated_end_date: Date | null;
  estimated_end_date: Date | null;
  planned_work: number | null;
  percent_complete: number | null;
  risk_level: string | null; // None, Low, Medium, High
  netsuite_id: string | null;
  selected: boolean;
  created_at: Date;
  customer_company_name?: string;
}

export interface Task {
  id: number;
  task_name: string;
  project_id: number | null;
  prospect_id: number | null;
  assigned_role: string | null;
  estimated_hours: number | null;
  netsuite_id: string | null;
  selected: boolean;
  created_at: Date;
  project_name?: string;
}

export type EntityType = 'prospects' | 'customers' | 'service_items' | 'projects' | 'tasks';

export interface GenerationConfig {
  count: number;
  entityType: EntityType;
}
