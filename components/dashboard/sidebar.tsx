"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Briefcase,
  FolderKanban,
  CheckSquare,
  LayoutDashboard,
  Rocket,
} from "lucide-react";
import type { EntityType } from "@/lib/demo-types";

interface SidebarProps {
  activeTab: EntityType | "overview" | "netsuite";
  onTabChange: (tab: EntityType | "overview" | "netsuite") => void;
  counts: {
    prospects: number;
    customers: number;
    serviceItems: number;
    projects: number;
    tasks: number;
  };
}

const navItems = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "netsuite" as const, label: "NetSuite Actions", icon: Rocket },
  { id: "prospects" as const, label: "Prospects", icon: Users },
  { id: "customers" as const, label: "Customers", icon: Building2 },
  { id: "service_items" as const, label: "Service Items", icon: Briefcase },
  { id: "projects" as const, label: "Projects", icon: FolderKanban },
  { id: "tasks" as const, label: "Tasks", icon: CheckSquare },
];

export function Sidebar({ activeTab, onTabChange, counts }: SidebarProps) {
  const getCount = (id: string) => {
    switch (id) {
      case "prospects":
        return counts.prospects;
      case "customers":
        return counts.customers;
      case "service_items":
        return counts.serviceItems;
      case "projects":
        return counts.projects;
      case "tasks":
        return counts.tasks;
      default:
        return null;
    }
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">NetSuite Demo</h1>
        <p className="text-sm text-muted-foreground mt-1">Data Generator</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const count = getCount(item.id);
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {count !== null && (
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        activeTab === item.id
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
