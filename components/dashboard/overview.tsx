"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FolderKanban, CheckSquare } from "lucide-react";

interface OverviewProps {
  counts: {
    prospects: number;
    customers: number;
    serviceItems: number;
    projects: number;
    tasks: number;
  };
}

const stats = [
  { key: "prospects", label: "Prospects", icon: Users, color: "text-blue-500" },
  { key: "customers", label: "Customers", icon: Building2, color: "text-green-500" },
  { key: "serviceItems", label: "Service Items", icon: Briefcase, color: "text-purple-500" },
  { key: "projects", label: "Projects", icon: FolderKanban, color: "text-orange-500" },
  { key: "tasks", label: "Tasks", icon: CheckSquare, color: "text-pink-500" },
];

export function Overview({ counts }: OverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Manage and generate demo data for your NetSuite instance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {counts[stat.key as keyof typeof counts]}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                records in database
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p>1. Select an entity type from the sidebar</p>
          <p>2. Use AI to generate realistic demo data</p>
          <p>3. Review and edit the generated records</p>
          <p>4. Push data to your NetSuite instance</p>
        </CardContent>
      </Card>
    </div>
  );
}
