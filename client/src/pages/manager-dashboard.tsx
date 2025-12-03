import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  WorkRequest,
  User,
  Asset,
  PreventiveMaintenance,
  DashboardStats,
  ServiceReport,
  HotspotItem,
  getStatusColor,
  getStatusLabel,
  getUrgencyLabel,
  UrgencyType,
} from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ClipboardList,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Users,
  Loader2,
  Calendar,
  Plus,
  Archive,
  Edit,
  Settings,
  UserPlus,
  Bot,
  TrendingUp,
  TrendingDown,
  Activity,
  Lightbulb,
  FileText,
  Eye,
  Clock,
  Flame,
  ChevronRight,
  UserCheck,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function MarkdownRenderer({ content }: { content: string }) {
  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let remaining = text;
    let keyCounter = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          result.push(
            <span key={keyCounter++}>
              {remaining.slice(0, boldMatch.index)}
            </span>,
          );
        }
        result.push(
          <strong key={keyCounter++} className="font-bold text-foreground">
            {boldMatch[1]}
          </strong>,
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

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentListItems: React.ReactNode[] = [];
    let elementKey = 0;

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul
            key={`list-${elementKey++}`}
            className="list-disc ml-5 space-y-1 my-2"
          >
            {currentListItems}
          </ul>,
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

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemContent = trimmed.slice(2);
        currentListItems.push(
          <li
            key={`item-${lineIndex}`}
            className="text-sm text-muted-foreground"
          >
            {parseInlineStyles(itemContent)}
          </li>,
        );
        return;
      }

      flushList();

      if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
        const headerText = trimmed.slice(2, -2);
        elements.push(
          <h3
            key={`h-${elementKey++}`}
            className="font-bold text-base text-foreground mt-4 mb-2 first:mt-0"
          >
            {headerText}
          </h3>,
        );
        return;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const itemContent = trimmed.replace(/^\d+\.\s/, "");
        elements.push(
          <div
            key={`num-${elementKey++}`}
            className="text-sm text-muted-foreground my-1 ml-2"
          >
            {parseInlineStyles(itemContent)}
          </div>,
        );
        return;
      }

      elements.push(
        <p
          key={`p-${elementKey++}`}
          className="text-sm text-muted-foreground my-1"
        >
          {parseInlineStyles(trimmed)}
        </p>,
      );
    });

    flushList();
    return elements;
  }, [content]);

  return <div className="space-y-1">{rendered}</div>;
}

interface Technician {
  id: string;
  name: string;
  username: string;
}

const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    manager: "bg-green-500/15 text-green-700 border-green-300",
    technician: "bg-yellow-500/15 text-yellow-700 border-yellow-300",
    employee: "bg-blue-500/15 text-blue-700 border-blue-300",
  };
  return colors[role] || "bg-gray-500/15 text-gray-700 border-gray-300";
};

const getUserStatusColor = (isActive: boolean = true): string => {
  if (isActive) {
    return "bg-green-500/15 text-green-700 border-green-300";
  }
  return "bg-red-500/15 text-red-700 border-red-300";
};

export default function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const [approveDialog, setApproveDialog] = useState<WorkRequest | null>(null);
  const [denyDialog, setDenyDialog] = useState<WorkRequest | null>(null);
  const [closeDialog, setCloseDialog] = useState<WorkRequest | null>(null);
  const [technicianToAssign, setTechnicianToAssign] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("standstill");
  const [denyReason, setDenyReason] = useState("");

  const [userDialog, setUserDialog] = useState<{
    mode: "create" | "edit";
    user?: User;
  } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "technician" | "manager">(
    "employee",
  );

  const [pmDialog, setPmDialog] = useState(false);
  const [pmAssetId, setPmAssetId] = useState("");
  const [pmDescription, setPmDescription] = useState("");
  const [pmFrequency, setPmFrequency] = useState<string>("monthly");
  const [pmNextDueDate, setPmNextDueDate] = useState("");
  const [pmTechnicianId, setPmTechnicianId] = useState("");
  const [pmTasks, setPmTasks] = useState("");
  const [pmDuration, setPmDuration] = useState("60");

  const [aiSummaryDialog, setAiSummaryDialog] = useState<Asset | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummaryCache, setAiSummaryCache] = useState<Record<string, string>>(
    {},
  );

  const [assetDetailDialog, setAssetDetailDialog] = useState<Asset | null>(
    null,
  );
  const [assetServiceReports, setAssetServiceReports] = useState<
    ServiceReport[]
  >([]);
  const [assetRequests, setAssetRequests] = useState<WorkRequest[]>([]);
  const [assetDetailLoading, setAssetDetailLoading] = useState(false);

  const [requestDetailDialog, setRequestDetailDialog] =
    useState<WorkRequest | null>(null);

  const [workOrderDialog, setWorkOrderDialog] = useState(false);
  const [woAssetId, setWoAssetId] = useState("");
  const [woDescription, setWoDescription] = useState("");
  const [woUrgency, setWoUrgency] = useState<UrgencyType>("standstill");

  const { data: requests = [], isLoading } = useQuery<WorkRequest[]>({
    queryKey: ["requests-all"],
    queryFn: async () => {
      const response = await fetch("/api/requests/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["technicians"],
    queryFn: async () => {
      const response = await fetch("/api/users/technicians", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch technicians");
      return response.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
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

  const { data: pmSchedules = [] } = useQuery<PreventiveMaintenance[]>({
    queryKey: ["pm-schedules"],
    queryFn: async () => {
      const response = await fetch("/api/pm-schedules", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch PM schedules");
      return response.json();
    },
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: hotspots = [] } = useQuery<HotspotItem[]>({
    queryKey: ["hotspots"],
    queryFn: async () => {
      const response = await fetch("/api/hotspots", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch hotspots");
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      id,
      technicianId,
      scheduledDate,
      urgency,
    }: {
      id: string;
      technicianId: string;
      scheduledDate: string;
      urgency: string;
    }) => {
      const response = await fetch(`/api/requests/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ technicianId, scheduledDate, urgency }),
      });
      if (!response.ok) throw new Error("Failed to approve request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["hotspots"] });
      setApproveDialog(null);
      resetApproveForm();
      toast({
        title: "Request Approved",
        description: "The request has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/requests/${id}/deny`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to deny request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setDenyDialog(null);
      setDenyReason("");
      toast({
        title: "Request Denied",
        description: "The request has been denied.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deny request.",
        variant: "destructive",
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/requests/${id}/close`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to close request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setCloseDialog(null);
      toast({
        title: "Request Closed",
        description: "The request has been marked as closed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close request.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      role: string;
    }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setUserDialog(null);
      resetUserForm();
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; role?: string; password?: string };
    }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      setUserDialog(null);
      resetUserForm();
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const archiveUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}/archive`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast({
        title: "User Archived",
        description: "User has been archived successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPmMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/pm-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create PM schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-schedules"] });
      setPmDialog(false);
      resetPmForm();
      toast({
        title: "PM Schedule Created",
        description: "Preventive maintenance schedule created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create PM schedule.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (!approveDialog || !technicianToAssign || !scheduledDate) return;
    approveMutation.mutate({
      id: approveDialog.id,
      technicianId: technicianToAssign,
      scheduledDate,
      urgency,
    });
  };

  const handleDeny = () => {
    if (!denyDialog || !denyReason) return;
    denyMutation.mutate({ id: denyDialog.id, reason: denyReason });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email: newEmail,
      password: newPassword,
      name: newName,
      role: newRole,
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDialog?.user) return;
    updateUserMutation.mutate({
      id: userDialog.user._id,
      data: {
        name: newName || undefined,
        role: newRole || undefined,
        password: newPassword || undefined,
      },
    });
  };

  const handleCreatePm = (e: React.FormEvent) => {
    e.preventDefault();
    createPmMutation.mutate({
      assetId: pmAssetId,
      description: pmDescription,
      frequency: pmFrequency,
      nextDueDate: pmNextDueDate,
      technicianId: pmTechnicianId || undefined,
      tasks: pmTasks.split("\n").filter((t) => t.trim()),
      estimatedDuration: parseInt(pmDuration) || 60,
    });
  };

  const resetApproveForm = () => {
    setTechnicianToAssign("");
    setScheduledDate("");
    setUrgency("standstill");
  };

  const resetUserForm = () => {
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setNewRole("employee");
  };

  const resetPmForm = () => {
    setPmAssetId("");
    setPmDescription("");
    setPmFrequency("monthly");
    setPmNextDueDate("");
    setPmTechnicianId("");
    setPmTasks("");
    setPmDuration("60");
  };

  const openEditUser = (user: User) => {
    setUserDialog({ mode: "edit", user });
    setNewName(user.name);
    setNewRole(user.role);
    setNewPassword("");
  };

  const fetchAiSummary = async (assetId: string) => {
    setAiLoading(true);
    try {
      const response = await fetch(`/api/ai/summary/${assetId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to get AI summary");
      }
      const data = await response.json();
      setAiSummary(data.summary);
      setAiSummaryCache((prev) => ({ ...prev, [assetId]: data.summary }));
    } catch (error: any) {
      setAiSummary(
        "Unable to generate summary. Please try again or check that the Gemini API key is configured correctly.",
      );
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

  const fetchAssetDetails = async (assetId: string) => {
    setAssetDetailLoading(true);
    try {
      const [reportsRes, requestsRes] = await Promise.all([
        fetch(`/api/assets/${assetId}/service-reports`, {
          credentials: "include",
        }),
        fetch(`/api/assets/${assetId}/requests`, { credentials: "include" }),
      ]);

      if (reportsRes.ok) {
        const reports = await reportsRes.json();
        setAssetServiceReports(reports);
      }
      if (requestsRes.ok) {
        const reqs = await requestsRes.json();
        setAssetRequests(reqs);
      }
    } catch (error) {
      console.error("Failed to fetch asset details:", error);
    } finally {
      setAssetDetailLoading(false);
    }
  };

  const handleOpenAssetDetail = (asset: Asset) => {
    setAssetDetailDialog(asset);
    setAssetServiceReports([]);
    setAssetRequests([]);
    fetchAssetDetails(asset.assetId);
  };

  const handleOpenRequestDetail = (request: WorkRequest) => {
    setRequestDetailDialog(request);
  };

  const getAssetRecommendation = (asset: Asset) => {
    if (asset.healthScore < 50) {
      return {
        type: "critical",
        message: "Schedule immediate inspection and maintenance",
        color: "text-red-600 bg-red-50",
      };
    }
    if (asset.healthScore < 70) {
      return {
        type: "warning",
        message: "Consider preventive maintenance soon",
        color: "text-yellow-600 bg-yellow-50",
      };
    }
    if (asset.healthScore >= 90) {
      return {
        type: "good",
        message: "Asset in excellent condition",
        color: "text-green-600 bg-green-50",
      };
    }
    return {
      type: "ok",
      message: "Monitor during next scheduled check",
      color: "text-blue-600 bg-blue-50",
    };
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of work requests, assets, and maintenance operations.
        </p>
      </div>

      {/* Main Tally Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  Open Requests
                </p>
                <h3
                  className="text-2xl md:text-3xl font-bold mt-1"
                  data-testid="stat-open-requests"
                >
                  {stats?.requests.pending || 0}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  Active Work Orders
                </p>
                <h3
                  className="text-2xl md:text-3xl font-bold mt-1"
                  data-testid="stat-active-orders"
                >
                  {stats?.activeWorkOrders || 0}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  Assets at Risk
                </p>
                <h3
                  className="text-2xl md:text-3xl font-bold mt-1 text-red-600"
                  data-testid="stat-assets-risk"
                >
                  {stats?.assets.atRisk || 0}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">
                  Closed Orders
                </p>
                <h3
                  className="text-2xl md:text-3xl font-bold mt-1"
                  data-testid="stat-closed-orders"
                >
                  {stats?.requests.closed || 0}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hotspot Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Equipment Hotspots</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                Last 7 days
              </Badge>
            </div>
            <CardDescription>
              Equipment with the highest repeated failures
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hotspots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No equipment failures reported in the last 7 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.assetId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    data-testid={`hotspot-${hotspot.assetId}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-red-100 text-red-700"
                            : index === 1
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{hotspot.assetName}</p>
                        <p className="text-xs text-muted-foreground">
                          {hotspot.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{hotspot.count}</p>
                        <p className="text-xs text-muted-foreground">
                          failures
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {hotspot.technicianCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between group hover:border-primary"
              onClick={() => setWorkOrderDialog(true)}
              data-testid="quick-action-create-wo"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Work Order
              </span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between group hover:border-primary"
              onClick={() => setActiveTab("requests")}
              data-testid="quick-action-assign-tech"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Assign Technician
              </span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between group hover:border-primary"
              onClick={() => setActiveTab("requests")}
              data-testid="quick-action-approve"
            >
              <span className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Approve Requests
              </span>
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </Button>

            <div className="pt-2 border-t mt-3">
              <Button
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setUserDialog({ mode: "create" })}
                data-testid="quick-action-add-user"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add New User
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setPmDialog(true)}
                data-testid="quick-action-add-pm"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule PM
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Technicians</p>
                <p className="text-xl font-bold">{stats?.technicians || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Turnaround</p>
                <p className="text-xl font-bold">
                  {stats?.avgTurnaroundHours || 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Healthy Assets</p>
                <p className="text-xl font-bold">
                  {assets.filter((a) => a.healthScore >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Need Attention</p>
                <p className="text-xl font-bold">
                  {
                    assets.filter(
                      (a) => a.healthScore >= 50 && a.healthScore < 70,
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="pm" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">PM</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Pending Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{req.assetName}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.tswrNo}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setApproveDialog(req);
                            setUrgency(req.urgency);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming PM */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                {pmSchedules.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No scheduled maintenance
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pmSchedules.slice(0, 5).map((pm) => (
                      <div
                        key={pm.scheduleId}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{pm.assetName}</p>
                          <p className="text-xs text-muted-foreground">
                            Due:{" "}
                            {new Date(pm.nextDueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {pm.frequency.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Work Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TSWR No.</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow
                        key={req.id}
                        data-testid={`row-request-${req.id}`}
                      >
                        <TableCell className="font-mono text-xs">
                          {req.tswrNo}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{req.assetName}</span>
                            <span className="text-xs text-muted-foreground">
                              {req.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {getUrgencyLabel(req.urgency)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(req.status)}
                          >
                            {getStatusLabel(req.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {req.assignedTo || (
                            <span className="text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {req.requesterFeedback ? (
                            <span className="text-sm text-green-600">
                              {req.requesterFeedback.substring(0, 30)}...
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {req.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenRequestDetail(req)}
                                data-testid={`button-view-${req.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setApproveDialog(req);
                                  setUrgency(req.urgency);
                                }}
                                data-testid={`button-approve-${req.id}`}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => setDenyDialog(req)}
                                data-testid={`button-deny-${req.id}`}
                              >
                                Deny
                              </Button>
                            </>
                          )}
                          {req.status === "resolved" &&
                            req.requesterConfirmedAt && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCloseDialog(req)}
                                data-testid={`button-close-${req.id}`}
                              >
                                Close
                              </Button>
                            )}
                          {req.status === "closed" && req.turnaroundTime && (
                            <span className="text-xs text-muted-foreground">
                              {req.turnaroundTime}h turnaround
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pm" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preventive Maintenance Schedules</CardTitle>
              <Button
                onClick={() => setPmDialog(true)}
                className="gap-2"
                data-testid="button-add-pm"
              >
                <Plus className="w-4 h-4" />
                Add PM Schedule
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Schedule ID</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pmSchedules.map((pm) => (
                      <TableRow key={pm.scheduleId}>
                        <TableCell className="font-mono text-xs">
                          {pm.scheduleId}
                        </TableCell>
                        <TableCell>{pm.assetName}</TableCell>
                        <TableCell>{pm.description}</TableCell>
                        <TableCell className="capitalize">
                          {pm.frequency.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          {new Date(pm.nextDueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{pm.assignedToName || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button
                onClick={() => setUserDialog({ mode: "create" })}
                className="gap-2"
                data-testid="button-add-user"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user._id}
                        data-testid={`row-user-${user._id}`}
                      >
                        <TableCell className="font-mono">
                          {user.username}
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`capitalize ${getRoleColor(user.role)}`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getUserStatusColor(!user.isArchived)}
                          >
                            {user.isArchived ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditUser(user)}
                            data-testid={`button-edit-user-${user._id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => archiveUserMutation.mutate(user._id)}
                            data-testid={`button-archive-user-${user._id}`}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const recommendation = getAssetRecommendation(asset);
              return (
                <Card key={asset.assetId} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {asset.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">
                          {asset.assetId}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {asset.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Health Score</span>
                        <span className="font-semibold">
                          {asset.healthScore}%
                        </span>
                      </div>
                      <Progress
                        value={asset.healthScore}
                        className={`h-2 ${
                          asset.healthScore >= 80
                            ? "[&>div]:bg-green-500"
                            : asset.healthScore >= 50
                              ? "[&>div]:bg-yellow-500"
                              : "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="text-right text-xs">
                          {asset.location.split(",")[0]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Current Value
                        </span>
                        <span>₱{asset.currentValue.toLocaleString()}</span>
                      </div>
                      {asset.lastMaintenanceDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Maintenance
                          </span>
                          <span>
                            {new Date(
                              asset.lastMaintenanceDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-xs p-2 rounded flex items-center gap-2 ${recommendation.color}`}
                    >
                      <Lightbulb className="w-3 h-3" />
                      {recommendation.message}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleOpenAssetDetail(asset)}
                        data-testid={`button-view-asset-${asset.assetId}`}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleOpenAiSummary(asset)}
                        data-testid={`button-ai-summary-${asset.assetId}`}
                      >
                        <Bot className="w-4 h-4" />
                        AI Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Work Request</DialogTitle>
            <DialogDescription>
              Assign a technician and schedule date for {approveDialog?.tswrNo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Technician</label>
              <Select
                value={technicianToAssign}
                onValueChange={setTechnicianToAssign}
              >
                <SelectTrigger data-testid="select-technician">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                data-testid="input-scheduled-date"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Urgency</label>
              <Select
                value={urgency}
                onValueChange={(v) => setUrgency(v as UrgencyType)}
              >
                <SelectTrigger data-testid="select-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standstill">Stand Still</SelectItem>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="on_occasion">On Occasion</SelectItem>
                  <SelectItem value="during_maintenance">
                    During Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!technicianToAssign || !scheduledDate}
              data-testid="button-confirm-approve"
            >
              Approve & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={!!denyDialog} onOpenChange={() => setDenyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Work Request</DialogTitle>
            <DialogDescription>
              Provide a reason for denying {denyDialog?.tswrNo}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter denial reason..."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            data-testid="input-deny-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={!denyReason}
              data-testid="button-confirm-deny"
            >
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={!!closeDialog} onOpenChange={() => setCloseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Work Request</DialogTitle>
            <DialogDescription>
              Confirm closing {closeDialog?.tswrNo}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => closeDialog && closeMutation.mutate(closeDialog.id)}
              data-testid="button-confirm-close"
            >
              Close Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog
        open={!!userDialog}
        onOpenChange={() => {
          setUserDialog(null);
          resetUserForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userDialog?.mode === "create" ? "Create User" : "Edit User"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={
              userDialog?.mode === "create" ? handleCreateUser : handleUpdateUser
            }
          >
            <div className="space-y-4">
              {userDialog?.mode === "create" && (
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    data-testid="input-user-email"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required={userDialog?.mode === "create"}
                  data-testid="input-user-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required={userDialog?.mode === "create"}
                  placeholder={
                    userDialog?.mode === "edit"
                      ? "Leave blank to keep current"
                      : ""
                  }
                  data-testid="input-user-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={newRole}
                  onValueChange={(v) =>
                    setNewRole(v as "employee" | "technician" | "manager")
                  }
                >
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUserDialog(null);
                  resetUserForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-user">
                {userDialog?.mode === "create" ? "Create" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PM Dialog */}
      <Dialog open={pmDialog} onOpenChange={setPmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create PM Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePm}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Asset</label>
                <Select value={pmAssetId} onValueChange={setPmAssetId}>
                  <SelectTrigger data-testid="select-pm-asset">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.assetId} value={asset.assetId}>
                        {asset.name} ({asset.assetId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={pmDescription}
                  onChange={(e) => setPmDescription(e.target.value)}
                  required
                  data-testid="input-pm-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={pmFrequency} onValueChange={setPmFrequency}>
                  <SelectTrigger data-testid="select-pm-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Next Due Date</label>
                <Input
                  type="date"
                  value={pmNextDueDate}
                  onChange={(e) => setPmNextDueDate(e.target.value)}
                  required
                  data-testid="input-pm-due-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Assign Technician (Optional)
                </label>
                <Select value={pmTechnicianId} onValueChange={setPmTechnicianId}>
                  <SelectTrigger data-testid="select-pm-technician">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tasks (one per line)</label>
                <Textarea
                  value={pmTasks}
                  onChange={(e) => setPmTasks(e.target.value)}
                  placeholder="Check oil levels&#10;Inspect belts&#10;Clean filters"
                  data-testid="input-pm-tasks"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPmDialog(false);
                  resetPmForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!pmAssetId || !pmDescription || !pmNextDueDate}
                data-testid="button-save-pm"
              >
                Create Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog
        open={!!aiSummaryDialog}
        onOpenChange={() => setAiSummaryDialog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Analysis: {aiSummaryDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Service report analysis from the last 30 days
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-4">
                <MarkdownRenderer content={aiSummary} />
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => aiSummaryDialog && fetchAiSummary(aiSummaryDialog.assetId)}
              disabled={aiLoading}
            >
              Refresh Analysis
            </Button>
            <Button onClick={() => setAiSummaryDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Detail Dialog */}
      <Dialog
        open={!!assetDetailDialog}
        onOpenChange={() => setAssetDetailDialog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{assetDetailDialog?.name}</DialogTitle>
            <DialogDescription>
              {assetDetailDialog?.assetId} - {assetDetailDialog?.location}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {assetDetailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="reports">
                <TabsList>
                  <TabsTrigger value="reports">Service Reports</TabsTrigger>
                  <TabsTrigger value="requests">Work Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="reports" className="mt-4">
                  {assetServiceReports.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No service reports found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assetServiceReports.map((report) => (
                        <div
                          key={report.reportId}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-sm">
                              {report.reportId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(report.serviceDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{report.workDescription}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            By: {report.preparedByName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                  {assetRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No work requests found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assetRequests.map((req) => (
                        <div key={req.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-sm">{req.tswrNo}</span>
                            <Badge
                              variant="outline"
                              className={getStatusColor(req.status)}
                            >
                              {getStatusLabel(req.status)}
                            </Badge>
                          </div>
                          <p className="text-sm">{req.workDescription}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog
        open={!!requestDetailDialog}
        onOpenChange={() => setRequestDetailDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>{requestDetailDialog?.tswrNo}</DialogDescription>
          </DialogHeader>
          {requestDetailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Asset</label>
                  <p className="font-medium">{requestDetailDialog.assetName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Location
                  </label>
                  <p className="font-medium">{requestDetailDialog.location}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Submitted By
                  </label>
                  <p className="font-medium">{requestDetailDialog.submittedBy}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Urgency
                  </label>
                  <Badge variant="secondary" className="capitalize">
                    {getUrgencyLabel(requestDetailDialog.urgency)}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Description
                </label>
                <p className="font-medium">{requestDetailDialog.workDescription}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDetailDialog(null)}
            >
              Close
            </Button>
            {requestDetailDialog?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDenyDialog(requestDetailDialog);
                    setRequestDetailDialog(null);
                  }}
                >
                  Deny
                </Button>
                <Button
                  onClick={() => {
                    setApproveDialog(requestDetailDialog);
                    setUrgency(requestDetailDialog.urgency);
                    setRequestDetailDialog(null);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Order Dialog */}
      <Dialog open={workOrderDialog} onOpenChange={setWorkOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>
              Create a new work order for an asset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset</label>
              <Select value={woAssetId} onValueChange={setWoAssetId}>
                <SelectTrigger data-testid="select-wo-asset">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.assetId} value={asset.assetId}>
                      {asset.name} ({asset.assetId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Work Description</label>
              <Textarea
                value={woDescription}
                onChange={(e) => setWoDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                data-testid="input-wo-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Urgency</label>
              <Select
                value={woUrgency}
                onValueChange={(v) => setWoUrgency(v as UrgencyType)}
              >
                <SelectTrigger data-testid="select-wo-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standstill">Stand Still</SelectItem>
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="on_occasion">On Occasion</SelectItem>
                  <SelectItem value="during_maintenance">
                    During Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkOrderDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!woAssetId || !woDescription}
              onClick={() => {
                toast({
                  title: "Work Order Created",
                  description: "Navigate to Work Requests to approve and assign.",
                });
                setWorkOrderDialog(false);
                setWoAssetId("");
                setWoDescription("");
                setWoUrgency("standstill");
              }}
              data-testid="button-create-wo"
            >
              Create Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
