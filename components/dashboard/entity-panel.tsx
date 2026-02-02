"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "./data-table";
import { Sparkles, Upload, Trash2, Loader2 } from "lucide-react";
import type { EntityType, Prospect, Customer, ServiceItem, Project, Task } from "@/lib/demo-types";

interface EntityPanelProps {
  entityType: EntityType;
  data: Prospect[] | Customer[] | ServiceItem[] | Project[] | Task[];
  onGenerate: (count: number) => Promise<void>;
  onPushToNetSuite: () => Promise<void>;
  onClearAll: () => Promise<void>;
  onDataChange?: () => void;
}

const entityLabels: Record<EntityType, string> = {
  prospects: "Prospects",
  customers: "Customers",
  service_items: "Service Items",
  projects: "Projects",
  tasks: "Tasks",
};

export function EntityPanel({
  entityType,
  data,
  onGenerate,
  onPushToNetSuite,
  onClearAll,
  onDataChange,
}: EntityPanelProps) {
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(count);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      await onPushToNetSuite();
    } finally {
      setIsPushing(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClearAll();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{entityLabels[entityType]}</h2>
          <p className="text-muted-foreground mt-1">
            {data.length} records in database
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Generate Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="count" className="text-foreground">Number of records</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-32"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
            <Button
              variant="outline"
              onClick={handlePush}
              disabled={isPushing || data.length === 0}
            >
              {isPushing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Push to NetSuite
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={isClearing || data.length === 0}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable entityType={entityType} data={data} onDataChange={onDataChange} />
        </CardContent>
      </Card>
    </div>
  );
}
