import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  WorkRequest, Asset, ServiceReport, PreventiveMaintenance, PartMaterial,
  getStatusColor, getStatusLabel, getUrgencyLabel, UrgencyType 
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Calendar, AlertCircle, Loader2, PlayCircle, CheckCircle2, XCircle,
  Wrench, ClipboardList, FileText, Bot, Plus, Trash2, Clock
} from "lucide-react";

function MarkdownRenderer({ content }: { content: string }) {
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          result.push(<span key={keyCounter++}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        result.push(
          <strong key={keyCounter++} className="font-bold text-foreground">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        if (remaining) {
          result.push(<span key={keyCounter++}>{remaining}</span>);
        }
        break;
      }
    }
    
    return result;
  };

  const rendered = useMemo(() => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    let elementKey = 0;
    
    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${elementKey++}`} className="list-disc ml-5 space-y-1 my-2">
            {currentListItems}
          </ul>
        );
        currentListItems = [];
      }
    };
    
    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        flushList();
        return;
      }
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.slice(2);
        currentListItems.push(
          <li key={`item-${lineIndex}`} className="text-sm text-muted-foreground">
            {parseInlineStyles(itemContent)}
          </li>
        );
        return;
      }
      
      flushList();
      
      if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
        const headerText = trimmed.slice(2, -2);
        elements.push(
          <h3 key={`h-${elementKey++}`} className="font-bold text-base text-foreground mt-4 mb-2 first:mt-0">
            {headerText}
          </h3>
        );
        return;
      }
      
      if (/^\d+\.\s/.test(trimmed)) {
        const itemContent = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={`num-${elementKey++}`} className="text-sm text-muted-foreground my-1 ml-2">
            {parseInlineStyles(itemContent)}
          </div>
        );
        return;
      }
      
      elements.push(
        <p key={`p-${elementKey++}`} className="text-sm text-muted-foreground my-1">
          {parseInlineStyles(trimmed)}
        </p>
      );
    });
    
    flushList();
    return elements;
  }, [content]);
  
  return <div className="space-y-1">{rendered}</div>;
}

export default function TechnicianDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tasks");

  const [serviceReportDialog, setServiceReportDialog] = useState<WorkRequest | null>(null);
  const [cannotResolveDialog, setCannotResolveDialog] = useState<WorkRequest | null>(null);
  const [aiSummaryDialog, setAiSummaryDialog] = useState<Asset | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiSummaryCache, setAiSummaryCache] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [cannotResolveReason, setCannotResolveReason] = useState("");

  const [srWorkDescription, setSrWorkDescription] = useState("");
  const [srRemarks, setSrRemarks] = useState("");
  const [srUrgency, setSrUrgency] = useState<UrgencyType>("standstill");
  const [srWorkStartTime, setSrWorkStartTime] = useState("");
  const [srWorkEndTime, setSrWorkEndTime] = useState("");
  const [srLaborCost, setSrLaborCost] = useState("");
  const [srServiceType, setSrServiceType] = useState<"planned" | "unplanned">("unplanned");
  const [srHoursDown, setSrHoursDown] = useState("");
  const [srReportFindings, setSrReportFindings] = useState("");
  const [srServiceDate, setSrServiceDate] = useState("");
  const [srParts, setSrParts] = useState<PartMaterial[]>([]);

  const { data: requests = [], isLoading } = useQuery<WorkRequest[]>({
    queryKey: ["requests"],
    queryFn: async () => {
      const response = await fetch("/api/requests", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
  });

  const { data: pmSchedules = [] } = useQuery<PreventiveMaintenance[]>({
    queryKey: ["pm-schedules"],
    queryFn: async () => {
      const response = await fetch("/api/pm-schedules", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PM schedules");
      return response.json();
    },
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const { data: serviceReports = [] } = useQuery<ServiceReport[]>({
    queryKey: ["service-reports"],
    queryFn: async () => {
      const response = await fetch("/api/service-reports", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch service reports");
      return response.json();
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/requests/${id}/start`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to start work");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Work Started", description: "Request status updated to Ongoing." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start work.", variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/requests/${id}/resolve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to resolve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Request Resolved", description: "Requester will be notified to confirm." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve request.", variant: "destructive" });
    },
  });

  const cannotResolveMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/requests/${id}/cannot-resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setCannotResolveDialog(null);
      setCannotResolveReason("");
      toast({ title: "Marked as Cannot Resolve", description: "Manager will be notified." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

  const createServiceReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/service-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create service report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setServiceReportDialog(null);
      resetServiceReportForm();
      toast({ title: "Service Report Created", description: "Report has been saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create service report.", variant: "destructive" });
    },
  });

  const completePmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pm-schedules/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to complete PM");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
      toast({ title: "PM Completed", description: "Next due date has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete PM.", variant: "destructive" });
    },
  });

  const fetchAiSummary = async (assetId: string) => {
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai/summary/${assetId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to get AI summary");
      const data = await response.json();
      setAiSummary(data.summary);
      setAiSummaryCache(prev => ({ ...prev, [assetId]: data.summary }));
    } catch (error) {
      setAiSummary("Unable to generate summary. Please try again or check that the Gemini API key is configured correctly.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenAiSummary = (asset: Asset) => {
    setAiSummaryDialog(asset);
    if (aiSummaryCache[asset.assetId]) {
      setAiSummary(aiSummaryCache[asset.assetId]);
    } else {
      setAiSummary("");
      fetchAiSummary(asset.assetId);
    }
  };

  const handleSubmitServiceReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceReportDialog) return;

    createServiceReportMutation.mutate({
      tswrNo: serviceReportDialog.tswrNo,
      workRequestId: serviceReportDialog.id,
      assetId: serviceReportDialog.assetId,
      workDescription: srWorkDescription,
      remarks: srRemarks,
      urgency: srUrgency,
      workStartTime: srWorkStartTime,
      workEndTime: srWorkEndTime,
      laborCost: parseFloat(srLaborCost) || 0,
      partsMaterials: srParts,
      serviceType: srServiceType,
      hoursDown: parseFloat(srHoursDown) || 0,
      reportFindings: srReportFindings,
      serviceDate: srServiceDate,
    });
  };

  const resetServiceReportForm = () => {
    setSrWorkDescription("");
    setSrRemarks("");
    setSrUrgency("standstill");
    setSrWorkStartTime("");
    setSrWorkEndTime("");
    setSrLaborCost("");
    setSrServiceType("unplanned");
    setSrHoursDown("");
    setSrReportFindings("");
    setSrServiceDate("");
    setSrParts([]);
  };

  const addPart = () => {
    setSrParts([...srParts, { partName: "", partNo: "", quantity: 1, cost: 0 }]);
  };

  const updatePart = (index: number, field: keyof PartMaterial, value: string | number) => {
    const updated = [...srParts];
    (updated[index] as any)[field] = value;
    setSrParts(updated);
  };

  const removePart = (index: number) => {
    setSrParts(srParts.filter((_, i) => i !== index));
  };

  const openServiceReport = (req: WorkRequest) => {
    setServiceReportDialog(req);
    setSrWorkDescription(req.workDescription);
    setSrUrgency(req.urgency);
    setSrServiceDate(new Date().toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Technician Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your tasks, PM schedules, and service reports.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            My Tasks
          </TabsTrigger>
          <TabsTrigger value="pm" className="gap-2">
            <Wrench className="w-4 h-4" />
            PM Schedule
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Bot className="w-4 h-4" />
            Asset Health
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            Service Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <div className="grid gap-6">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tasks assigned currently. Good job!
              </div>
            ) : requests.map((req) => (
              <Card key={req.id} className="overflow-hidden" data-testid={`card-request-${req.id}`}>
                <div className={`h-1.5 w-full ${
                  req.urgency === 'immediately' ? 'bg-red-500' : 
                  req.urgency === 'on_occasion' ? 'bg-orange-500' : 
                  'bg-blue-500'
                }`} />
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono">{req.tswrNo}</Badge>
                            <Badge className={getStatusColor(req.status)}>{getStatusLabel(req.status)}</Badge>
                            <Badge variant="secondary">{getUrgencyLabel(req.urgency)}</Badge>
                          </div>
                          <h3 className="text-xl font-semibold">{req.assetName}</h3>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground bg-muted/30 p-4 rounded-md">
                        {req.workDescription}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {req.location}
                        </div>
                        {req.scheduledDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Scheduled: {new Date(req.scheduledDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          By {req.submittedBy}
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l pl-0 lg:pl-6 pt-4 lg:pt-0 flex flex-col justify-center gap-3">
                      {req.status === 'scheduled' && (
                        <Button 
                          onClick={() => startWorkMutation.mutate(req.id)}
                          disabled={startWorkMutation.isPending}
                          className="gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Start Work
                        </Button>
                      )}
                      
                      {req.status === 'ongoing' && (
                        <>
                          <Button 
                            onClick={() => openServiceReport(req)}
                            variant="outline"
                            className="gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Create Report
                          </Button>
                          <Button 
                            onClick={() => resolveMutation.mutate(req.id)}
                            disabled={resolveMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Resolved
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => setCannotResolveDialog(req)}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Cannot Resolve
                          </Button>
                        </>
                      )}

                      {req.status === 'resolved' && (
                        <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded">
                          <CheckCircle2 className="w-4 h-4" />
                          Waiting for Confirmation
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pm" className="mt-6">
          <div className="grid gap-4">
            {pmSchedules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No PM schedules assigned to you.
              </div>
            ) : pmSchedules.map((pm) => (
              <Card key={pm.scheduleId}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{pm.scheduleId}</Badge>
                        <Badge variant="secondary" className="capitalize">{pm.frequency.replace('_', ' ')}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{pm.assetName}</h3>
                      <p className="text-muted-foreground">{pm.description}</p>
                      {pm.tasks.length > 0 && (
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {pm.tasks.slice(0, 3).map((task, i) => (
                            <li key={i}>{task}</li>
                          ))}
                          {pm.tasks.length > 3 && <li>...and {pm.tasks.length - 3} more</li>}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Next Due</p>
                        <p className="font-semibold">{new Date(pm.nextDueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Est. {pm.estimatedDuration} min
                      </div>
                      <Button
                        onClick={() => completePmMutation.mutate(pm.scheduleId)}
                        disabled={completePmMutation.isPending}
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.assetId}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{asset.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{asset.assetId}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{asset.status.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Health Score</span>
                      <span className="font-semibold">{asset.healthScore}%</span>
                    </div>
                    <Progress 
                      value={asset.healthScore} 
                      className={`h-2 ${
                        asset.healthScore >= 80 ? '[&>div]:bg-green-500' : 
                        asset.healthScore >= 50 ? '[&>div]:bg-yellow-500' : 
                        '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Value</span>
                      <span>₱{asset.currentValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depreciation</span>
                      <span>{asset.depreciationRate}%/year</span>
                    </div>
                    {asset.lastMaintenanceDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Maintenance</span>
                        <span>{new Date(asset.lastMaintenanceDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={() => handleOpenAiSummary(asset)}
                  >
                    <Bot className="w-4 h-4" />
                    AI Summary (30 days)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Service Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No service reports yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceReports.map((report) => (
                    <div key={report.reportId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">{report.reportId}</Badge>
                            <Badge variant="secondary">{report.tswrNo}</Badge>
                          </div>
                          <h4 className="font-semibold mt-1">{report.assetName}</h4>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.serviceDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.workDescription}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Man Hours: {report.manHours.toFixed(1)}</span>
                        <span>Parts: ₱{report.totalPartsCost}</span>
                        <span>Labor: ₱{report.laborCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Report Dialog */}
      <Dialog open={!!serviceReportDialog} onOpenChange={(open) => !open && setServiceReportDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Report (Form No. 505002/2)</DialogTitle>
            <DialogDescription>
              TSWR: {serviceReportDialog?.tswrNo} | Asset: {serviceReportDialog?.assetName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitServiceReport}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Date *</label>
                  <Input 
                    type="date" 
                    value={srServiceDate}
                    onChange={(e) => setSrServiceDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Type *</label>
                  <Select value={srServiceType} onValueChange={(v: any) => setSrServiceType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="unplanned">Unplanned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Description *</label>
                <Textarea 
                  value={srWorkDescription}
                  onChange={(e) => setSrWorkDescription(e.target.value)}
                  required
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <Select value={srUrgency} onValueChange={(v: UrgencyType) => setSrUrgency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standstill">Stand Still</SelectItem>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="on_occasion">On Occasion</SelectItem>
                    <SelectItem value="during_maintenance">During Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Start Time *</label>
                  <Input 
                    type="datetime-local"
                    value={srWorkStartTime}
                    onChange={(e) => setSrWorkStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work End Time *</label>
                  <Input 
                    type="datetime-local"
                    value={srWorkEndTime}
                    onChange={(e) => setSrWorkEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hours Down</label>
                  <Input 
                    type="number"
                    step="0.5"
                    value={srHoursDown}
                    onChange={(e) => setSrHoursDown(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Labor Cost (₱)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={srLaborCost}
                    onChange={(e) => setSrLaborCost(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Report/Findings *</label>
                <Textarea 
                  value={srReportFindings}
                  onChange={(e) => setSrReportFindings(e.target.value)}
                  required
                  placeholder="Result of service rendered and troubleshooting made..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Textarea 
                  value={srRemarks}
                  onChange={(e) => setSrRemarks(e.target.value)}
                  placeholder="Additional information..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Parts/Materials Used</label>
                  <Button type="button" variant="outline" size="sm" onClick={addPart}>
                    <Plus className="w-4 h-4 mr-1" /> Add Part
                  </Button>
                </div>
                {srParts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Input 
                        placeholder="Part Name"
                        value={part.partName}
                        onChange={(e) => updatePart(index, 'partName', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        placeholder="Part No."
                        value={part.partNo}
                        onChange={(e) => updatePart(index, 'partNo', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Cost"
                        value={part.cost}
                        onChange={(e) => updatePart(index, 'cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removePart(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setServiceReportDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createServiceReportMutation.isPending}>
                {createServiceReportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cannot Resolve Dialog */}
      <Dialog open={!!cannotResolveDialog} onOpenChange={(open) => !open && setCannotResolveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Resolve Issue</DialogTitle>
            <DialogDescription>
              Please explain why this issue cannot be resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason why the issue cannot be resolved..."
              value={cannotResolveReason}
              onChange={(e) => setCannotResolveReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCannotResolveDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => cannotResolveDialog && cannotResolveMutation.mutate({ 
                id: cannotResolveDialog.id, 
                reason: cannotResolveReason 
              })}
              disabled={!cannotResolveReason || cannotResolveMutation.isPending}
            >
              {cannotResolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog open={!!aiSummaryDialog} onOpenChange={(open) => !open && setAiSummaryDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Summary: {aiSummaryDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Analysis of service reports from the last 30 days
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Generating summary...</span>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                {aiSummary ? (
                  <MarkdownRenderer content={aiSummary} />
                ) : (
                  <p className="text-sm text-muted-foreground">No summary available.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiSummaryDialog(null)}>Close</Button>
            <Button onClick={() => aiSummaryDialog && fetchAiSummary(aiSummaryDialog.assetId)} disabled={aiLoading}>
              Refresh Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
