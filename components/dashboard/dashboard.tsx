"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Sidebar } from "./sidebar";
import { Overview } from "./overview";
import { EntityPanel } from "./entity-panel";
import { NetSuitePanel } from "./netsuite-panel";
import type { EntityType, Prospect, Customer, ServiceItem, Project, Task } from "@/lib/demo-types";

interface DashboardData {
  counts: {
    prospects: number;
    customers: number;
    serviceItems: number;
    projects: number;
    tasks: number;
  };
  prospects: Prospect[];
  customers: Customer[];
  serviceItems: ServiceItem[];
  projects: Project[];
  tasks: Task[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Dashboard({ initialData }: { initialData: DashboardData }) {
  const [activeTab, setActiveTab] = useState<EntityType | "overview" | "netsuite">("netsuite");

  const { data, mutate } = useSWR<DashboardData>("/api/demo-data", fetcher, {
    fallbackData: initialData,
    refreshInterval: 0,
  });

  const handleGenerate = useCallback(
    async (entityType: EntityType, count: number) => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, count }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate data");
      }

      mutate();
    },
    [mutate]
  );

  const handlePushToNetSuite = useCallback(
    async (entityType: EntityType) => {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to push to NetSuite");
      }

      alert(result.message || "Data pushed to NetSuite successfully!");
      mutate();
    },
    [mutate]
  );

  const handleClearAll = useCallback(
    async (entityType: EntityType) => {
      const response = await fetch("/api/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear data");
      }

      mutate();
    },
    [mutate]
  );

  const counts = data?.counts || initialData.counts;

  const getEntityData = (entityType: EntityType) => {
    switch (entityType) {
      case "prospects":
        return data?.prospects || [];
      case "customers":
        return data?.customers || [];
      case "service_items":
        return data?.serviceItems || [];
      case "projects":
        return data?.projects || [];
      case "tasks":
        return data?.tasks || [];
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      <main className="flex-1 overflow-auto p-8">
        {activeTab === "overview" ? (
          <Overview counts={counts} />
        ) : activeTab === "netsuite" ? (
          <NetSuitePanel onSuccess={() => mutate()} />
        ) : (
          <EntityPanel
            entityType={activeTab}
            data={getEntityData(activeTab)}
            onGenerate={(count) => handleGenerate(activeTab, count)}
            onPushToNetSuite={() => handlePushToNetSuite(activeTab)}
            onClearAll={() => handleClearAll(activeTab)}
          />
        )}
      </main>
    </div>
  );
}
