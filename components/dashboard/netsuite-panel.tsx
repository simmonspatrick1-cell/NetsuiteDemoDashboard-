"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, Building2, FolderKanban, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

const templates = [
  { value: "professional_services", label: "Professional Services" },
  { value: "energy", label: "Energy" },
  { value: "it_services", label: "IT Services" },
  { value: "creative", label: "Creative" },
];



export function NetSuitePanel({ onSuccess }: { onSuccess?: () => void }) {
  const [prospectName, setProspectName] = useState("");
  const [template, setTemplate] = useState("professional_services");
  const [isLoading, setIsLoading] = useState(false);
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  
  const [projectName, setProjectName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [serviceItemName, setServiceItemName] = useState("");
  const [isCreatingServiceItem, setIsCreatingServiceItem] = useState(false);

  const [batchCount, setBatchCount] = useState("5");
  const [batchTemplate, setBatchTemplate] = useState("professional_services");
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  const handleQuickSetup = async () => {
    if (!prospectName.trim()) {
      toast.error("Please enter a prospect name");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick_setup",
          prospectName,
          template,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Created customer and ${result.data?.projects?.length || 3} projects for ${prospectName}`);
        setProspectName("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create demo data");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }
    
    setIsCreatingCustomer(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_customer",
          customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Created customer: ${customerName}`);
        setCustomerName("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create customer");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !customerId.trim()) {
      toast.error("Please enter project name and NetSuite customer ID");
      return;
    }
    
    setIsCreatingProject(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_project",
          projectName,
          customerId: parseInt(customerId),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Created project: ${projectName}`);
        setProjectName("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create project");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCreateServiceItem = async () => {
    if (!serviceItemName.trim()) {
      toast.error("Please enter an item name");
      return;
    }
    
    setIsCreatingServiceItem(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_service_item",
          itemName: serviceItemName,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Created service item: ${serviceItemName}`);
        setServiceItemName("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create service item");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsCreatingServiceItem(false);
    }
  };

  const handleBatchCreate = async () => {
    setIsBatchCreating(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_create",
          customerCount: parseInt(batchCount),
          template: batchTemplate,
          projectsPerCustomer: 3,
          daysOfTime: 30,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Batch job submitted! Task ID: ${result.data?.data?.taskId || "pending"}`);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to start batch job");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsBatchCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">NetSuite Demo Data</h2>
        <p className="text-muted-foreground mt-1">
          Create demo customers and projects directly in NetSuite
        </p>
      </div>

      {/* Quick Setup - Most Common */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Rocket className="h-5 w-5" />
            Quick Setup (Recommended)
          </CardTitle>
        <CardDescription>
          Creates 1 customer + 3 projects in one click (Billing Type: Charge-Based, Project Expense Type: Regular)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label htmlFor="prospectName" className="text-foreground">Prospect/Company Name</Label>
            <Input
              id="prospectName"
              placeholder="Acme Corp"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
            />
          </div>
          <div className="space-y-2 w-[200px]">
            <Label htmlFor="template" className="text-foreground">Demo Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleQuickSetup} disabled={isLoading} size="lg">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Create Demo Data
          </Button>
        </div>
      </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Create Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Create Customer
            </CardTitle>
            <CardDescription>
              Create a single customer in NetSuite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-foreground">Company Name</Label>
              <Input
                id="customerName"
                placeholder="Test Company Inc"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="text-foreground">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="contact@company.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-foreground">Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="(555) 123-4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleCreateCustomer} disabled={isCreatingCustomer} className="w-full">
              {isCreatingCustomer ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Create Customer
            </Button>
          </CardContent>
        </Card>

        {/* Create Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FolderKanban className="h-5 w-5" />
              Create Project
            </CardTitle>
            <CardDescription>
              Create a project for an existing NetSuite customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-foreground">Project Name</Label>
              <Input
                id="projectName"
                placeholder="Strategic Initiative"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-foreground">NetSuite Customer ID</Label>
              <Input
                id="customerId"
                type="number"
                placeholder="12345"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Status: In Progress, Manager: Marc Collins, Billing: Charge-Based, Expense Type: Regular
            </p>
            <Button onClick={handleCreateProject} disabled={isCreatingProject} className="w-full">
              {isCreatingProject ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FolderKanban className="h-4 w-4 mr-2" />
              )}
              Create Project
            </Button>
          </CardContent>
        </Card>

        {/* Create Service Item */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5" />
              Service for Resale Item
            </CardTitle>
            <CardDescription>
              Create a service for resale item in NetSuite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceItemName" className="text-foreground">Item Name/Number</Label>
              <Input
                id="serviceItemName"
                placeholder="Consulting Services"
                value={serviceItemName}
                onChange={(e) => setServiceItemName(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Subsidiary: Parent (Holding Co.), Include Children: Yes, Tax Schedule: S2 - Non Taxable, Revenue Recognition Rule: Default One-Time Direct Posting, Rev Rec Forecast Rule: Default One-Time Direct Posting, Direct Revenue Posting: Yes
            </p>
            <Button onClick={handleCreateServiceItem} disabled={isCreatingServiceItem} className="w-full">
              {isCreatingServiceItem ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Create Service Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Batch Create */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Trash2 className="h-5 w-5" />
            Batch Create (Map/Reduce Job)
          </CardTitle>
          <CardDescription>
            Triggers a background job to create multiple customers, projects, and time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2 w-[120px]">
            <Label htmlFor="batchCount" className="text-foreground">Customers</Label>
            <Input
              id="batchCount"
              type="number"
              min={1}
              max={20}
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
            />
          </div>
          <div className="space-y-2 w-[200px]">
            <Label htmlFor="batchTemplate" className="text-foreground">Demo Template</Label>
            <Select value={batchTemplate} onValueChange={setBatchTemplate}>
              <SelectTrigger id="batchTemplate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleBatchCreate} disabled={isBatchCreating} variant="secondary">
            {isBatchCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Start Batch Job
          </Button>
        </div>
          <p className="text-sm text-muted-foreground mt-3">
            This creates {batchCount} customers, each with 3 projects and 30 days of time entries.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
