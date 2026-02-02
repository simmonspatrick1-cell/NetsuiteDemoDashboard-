"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, Building2, FolderKanban, Trash2, Package, FileText, ListTodo, Plus, X } from "lucide-react";
import { toast } from "sonner";

const templates = [
  { value: "professional_services", label: "Professional Services" },
  { value: "energy", label: "Energy" },
  { value: "it_services", label: "IT Services" },
  { value: "creative", label: "Creative" },
];

const UNIT_TYPES = [
  { id: "Hour", name: "Hour" },
  { id: "Day", name: "Day" },
  { id: "Week", name: "Week" },
  { id: "Each", name: "Each" },
];

interface NetSuiteCustomer {
  id: string;
  entityId: string;
  companyName: string;
}

interface NetSuiteProject {
  id: string;
  projectId: string;
  projectName: string;
  customerId: string;
}

interface NetSuiteServiceItem {
  id: string;
  itemId: string;
  displayName: string;
  description: string;
  basePrice: string;
}

interface NetSuiteEmployee {
  id: string;
  entityId: string;
  name: string;
  firstName: string;
  lastName: string;
}

interface EstimateLineItem {
  itemId: string;
  quantity: number;
  rate: number;
  description: string;
}

interface TaskAssignee {
  resourceId: string;
  units: number;
  plannedWork: number;
}



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
  const [serviceItemDisplayName, setServiceItemDisplayName] = useState("");
  const [serviceItemUnitType, setServiceItemUnitType] = useState("");
  const [serviceItemSalesPrice, setServiceItemSalesPrice] = useState("");
  const [serviceItemPurchasePrice, setServiceItemPurchasePrice] = useState("");
  const [isCreatingServiceItem, setIsCreatingServiceItem] = useState(false);

  const [batchCount, setBatchCount] = useState("5");
  const [batchTemplate, setBatchTemplate] = useState("professional_services");
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  // Estimate state
  const [estimateCustomerId, setEstimateCustomerId] = useState("");
  const [estimateProjectId, setEstimateProjectId] = useState("");
  const [estimateTitle, setEstimateTitle] = useState("");
  const [estimateMemo, setEstimateMemo] = useState("");
  const [estimateLineItems, setEstimateLineItems] = useState<EstimateLineItem[]>([
    { itemId: "", quantity: 1, rate: 0, description: "" }
  ]);
  const [isCreatingEstimate, setIsCreatingEstimate] = useState(false);

  // Project Task state
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskPlannedWork, setTaskPlannedWork] = useState("");
  const [taskStatus, setTaskStatus] = useState("Not Started");
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // NetSuite data for dropdowns
  const [customers, setCustomers] = useState<NetSuiteCustomer[]>([]);
  const [projects, setProjects] = useState<NetSuiteProject[]>([]);
  const [serviceItems, setServiceItems] = useState<NetSuiteServiceItem[]>([]);
  const [employees, setEmployees] = useState<NetSuiteEmployee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch NetSuite data on mount
  useEffect(() => {
    async function fetchNetSuiteData() {
      setIsLoadingData(true);
      try {
        const [customersRes, projectsRes, itemsRes, employeesRes] = await Promise.all([
          fetch("/api/netsuite-fields?type=customers"),
          fetch("/api/netsuite-fields?type=projects"),
          fetch("/api/netsuite-fields?type=service_items"),
          fetch("/api/netsuite-fields?type=employees"),
        ]);

        const [customersData, projectsData, itemsData, employeesData] = await Promise.all([
          customersRes.json(),
          projectsRes.json(),
          itemsRes.json(),
          employeesRes.json(),
        ]);

        if (customersData.success) setCustomers(customersData.data || []);
        if (projectsData.success) setProjects(projectsData.data || []);
        if (itemsData.success) setServiceItems(itemsData.data || []);
        if (employeesData.success) setEmployees(employeesData.data || []);
      } catch (error) {
        console.error("Failed to fetch NetSuite data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchNetSuiteData();
  }, []);

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
          displayName: serviceItemDisplayName || undefined,
          unitType: serviceItemUnitType || undefined,
          salesPrice: serviceItemSalesPrice ? parseFloat(serviceItemSalesPrice) : undefined,
          purchasePrice: serviceItemPurchasePrice ? parseFloat(serviceItemPurchasePrice) : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Created service item: ${serviceItemName}`);
        setServiceItemName("");
        setServiceItemDisplayName("");
        setServiceItemUnitType("");
        setServiceItemSalesPrice("");
        setServiceItemPurchasePrice("");
        // Refresh service items list
        const itemsRes = await fetch("/api/netsuite-fields?type=service_items&refresh=true");
        const itemsData = await itemsRes.json();
        if (itemsData.success) setServiceItems(itemsData.data || []);
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

  const handleCreateEstimate = async () => {
    if (!estimateCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    const validItems = estimateLineItems.filter(item => item.itemId);
    if (validItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsCreatingEstimate(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_estimate",
          customerId: parseInt(estimateCustomerId),
          projectId: estimateProjectId ? parseInt(estimateProjectId) : undefined,
          title: estimateTitle || undefined,
          memo: estimateMemo || undefined,
          items: validItems.map(item => ({
            itemId: parseInt(item.itemId),
            quantity: item.quantity,
            rate: item.rate || undefined,
            description: item.description || undefined,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Estimate created successfully!");
        setEstimateCustomerId("");
        setEstimateProjectId("");
        setEstimateTitle("");
        setEstimateMemo("");
        setEstimateLineItems([{ itemId: "", quantity: 1, rate: 0, description: "" }]);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create estimate");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsCreatingEstimate(false);
    }
  };

  const handleCreateProjectTask = async () => {
    if (!taskProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (!taskName.trim()) {
      toast.error("Please enter a task name");
      return;
    }
    if (!taskPlannedWork) {
      toast.error("Please enter planned work hours");
      return;
    }

    setIsCreatingTask(true);
    try {
      const response = await fetch("/api/push-netsuite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_project_task",
          projectId: parseInt(taskProjectId),
          taskName,
          plannedWork: parseFloat(taskPlannedWork),
          status: taskStatus,
          assignees: taskAssignees.filter(a => a.resourceId).map(a => ({
            resourceId: parseInt(a.resourceId),
            units: a.units,
            plannedWork: a.plannedWork,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Project task created successfully!");
        setTaskProjectId("");
        setTaskName("");
        setTaskPlannedWork("");
        setTaskStatus("Not Started");
        setTaskAssignees([]);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create project task");
      }
    } catch (error) {
      toast.error("Failed to connect to NetSuite");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const addEstimateLineItem = () => {
    setEstimateLineItems([...estimateLineItems, { itemId: "", quantity: 1, rate: 0, description: "" }]);
  };

  const removeEstimateLineItem = (index: number) => {
    setEstimateLineItems(estimateLineItems.filter((_, i) => i !== index));
  };

  const updateEstimateLineItem = (index: number, field: keyof EstimateLineItem, value: string | number) => {
    const updated = [...estimateLineItems];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill rate from service item's base price
    if (field === "itemId" && value) {
      const item = serviceItems.find(si => si.id === value);
      if (item?.basePrice) {
        updated[index].rate = parseFloat(item.basePrice) || 0;
      }
    }
    setEstimateLineItems(updated);
  };

  const addTaskAssignee = () => {
    setTaskAssignees([...taskAssignees, { resourceId: "", units: 100, plannedWork: parseFloat(taskPlannedWork) || 8 }]);
  };

  const removeTaskAssignee = (index: number) => {
    setTaskAssignees(taskAssignees.filter((_, i) => i !== index));
  };

  const updateTaskAssignee = (index: number, field: keyof TaskAssignee, value: string | number) => {
    const updated = [...taskAssignees];
    updated[index] = { ...updated[index], [field]: value };
    setTaskAssignees(updated);
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceItemName" className="text-foreground">Item Name/Number *</Label>
                <Input
                  id="serviceItemName"
                  placeholder="CONSULT-001"
                  value={serviceItemName}
                  onChange={(e) => setServiceItemName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceItemDisplayName" className="text-foreground">Display Name</Label>
                <Input
                  id="serviceItemDisplayName"
                  placeholder="Consulting Services - Hourly"
                  value={serviceItemDisplayName}
                  onChange={(e) => setServiceItemDisplayName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceItemUnitType" className="text-foreground">Unit Type</Label>
                <Select value={serviceItemUnitType} onValueChange={setServiceItemUnitType}>
                  <SelectTrigger id="serviceItemUnitType">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map((ut) => (
                      <SelectItem key={ut.id} value={ut.id}>{ut.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceItemSalesPrice" className="text-foreground">Sales Price</Label>
                <Input
                  id="serviceItemSalesPrice"
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={serviceItemSalesPrice}
                  onChange={(e) => setServiceItemSalesPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceItemPurchasePrice" className="text-foreground">Purchase Price</Label>
                <Input
                  id="serviceItemPurchasePrice"
                  type="number"
                  step="0.01"
                  placeholder="75.00"
                  value={serviceItemPurchasePrice}
                  onChange={(e) => setServiceItemPurchasePrice(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Subsidiary: Parent (Holding Co.), Include Children: Yes, Tax Schedule: S2 - Non Taxable, Revenue Recognition Rule: Default One-Time Direct Posting
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

      {/* Create Estimate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5" />
            Create Estimate
          </CardTitle>
          <CardDescription>
            Create an estimate with line items in NetSuite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimateCustomer" className="text-foreground">Customer *</Label>
              <Select value={estimateCustomerId} onValueChange={setEstimateCustomerId}>
                <SelectTrigger id="estimateCustomer">
                  <SelectValue placeholder={isLoadingData ? "Loading..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName || c.entityId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimateProject" className="text-foreground">Project (Optional)</Label>
              <Select value={estimateProjectId || "__none__"} onValueChange={(v) => setEstimateProjectId(v === "__none__" ? "" : v)}>
                <SelectTrigger id="estimateProject">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectName || p.projectId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimateTitle" className="text-foreground">Title</Label>
              <Input
                id="estimateTitle"
                placeholder="Estimate title"
                value={estimateTitle}
                onChange={(e) => setEstimateTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimateMemo" className="text-foreground">Memo</Label>
              <Input
                id="estimateMemo"
                placeholder="Internal memo"
                value={estimateMemo}
                onChange={(e) => setEstimateMemo(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEstimateLineItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {estimateLineItems.map((lineItem, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={lineItem.itemId}
                      onValueChange={(v) => updateEstimateLineItem(index, "itemId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service item" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.displayName || item.itemId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={lineItem.quantity}
                      onChange={(e) => updateEstimateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={lineItem.rate || ""}
                      onChange={(e) => updateEstimateLineItem(index, "rate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={lineItem.description}
                      onChange={(e) => updateEstimateLineItem(index, "description", e.target.value)}
                    />
                  </div>
                  {estimateLineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeEstimateLineItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleCreateEstimate} disabled={isCreatingEstimate} className="w-full">
            {isCreatingEstimate ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Create Estimate
          </Button>
        </CardContent>
      </Card>

      {/* Create Project Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ListTodo className="h-5 w-5" />
            Create Project Task
          </CardTitle>
          <CardDescription>
            Create a project task with assignees in NetSuite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskProject" className="text-foreground">Project *</Label>
              <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                <SelectTrigger id="taskProject">
                  <SelectValue placeholder={isLoadingData ? "Loading..." : "Select project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectName || p.projectId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskStatus" className="text-foreground">Status</Label>
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger id="taskStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskName" className="text-foreground">Task Name *</Label>
              <Input
                id="taskName"
                placeholder="Task name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskPlannedWork" className="text-foreground">Planned Work (hours) *</Label>
              <Input
                id="taskPlannedWork"
                type="number"
                step="0.5"
                placeholder="8"
                value={taskPlannedWork}
                onChange={(e) => setTaskPlannedWork(e.target.value)}
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Assignees (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTaskAssignee}>
                <Plus className="h-4 w-4 mr-1" /> Add Assignee
              </Button>
            </div>
            {taskAssignees.length > 0 && (
              <div className="space-y-2">
                {taskAssignees.map((assignee, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Select
                        value={assignee.resourceId}
                        onValueChange={(v) => updateTaskAssignee(index, "resourceId", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name || `${emp.firstName} ${emp.lastName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Units %"
                        value={assignee.units}
                        onChange={(e) => updateTaskAssignee(index, "units", parseFloat(e.target.value) || 100)}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Hours"
                        value={assignee.plannedWork}
                        onChange={(e) => updateTaskAssignee(index, "plannedWork", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeTaskAssignee(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleCreateProjectTask} disabled={isCreatingTask} className="w-full">
            {isCreatingTask ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ListTodo className="h-4 w-4 mr-2" />
            )}
            Create Project Task
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
