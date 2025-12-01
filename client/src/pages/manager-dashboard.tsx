import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkRequest, User, Asset, PreventiveMaintenance, DashboardStats, getStatusColor, getStatusLabel, getUrgencyLabel, UrgencyType } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  BarChart3, Clock, CheckCircle2, Users, Loader2, XCircle, Calendar, 
  Plus, Trash2, Edit, Wrench, Settings, ClipboardList, UserPlus
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  username: string;
}

export default function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("requests");
  
  const [approveDialog, setApproveDialog] = useState<WorkRequest | null>(null);
  const [denyDialog, setDenyDialog] = useState<WorkRequest | null>(null);
  const [closeDialog, setCloseDialog] = useState<WorkRequest | null>(null);
  const [technicianToAssign, setTechnicianToAssign] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("standstill");
  const [denyReason, setDenyReason] = useState("");

  const [userDialog, setUserDialog] = useState<{ mode: 'create' | 'edit'; user?: User } | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"employee" | "technician" | "manager">("employee");

  const [pmDialog, setPmDialog] = useState(false);
  const [pmAssetId, setPmAssetId] = useState("");
  const [pmDescription, setPmDescription] = useState("");
  const [pmFrequency, setPmFrequency] = useState<string>("monthly");
  const [pmNextDueDate, setPmNextDueDate] = useState("");
  const [pmTechnicianId, setPmTechnicianId] = useState("");
  const [pmTasks, setPmTasks] = useState("");
  const [pmDuration, setPmDuration] = useState("60");

  const { data: requests = [], isLoading } = useQuery<WorkRequest[]>({
    queryKey: ["requests-all"],
    queryFn: async () => {
      const response = await fetch("/api/requests/all", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
  });

  const { data: technicians = [] } = useQuery<Technician[]>({
    queryKey: ["technicians"],
    queryFn: async () => {
      const response = await fetch("/api/users/technicians", { credentials: "include" });
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
      const response = await fetch("/api/pm-schedules", { credentials: "include" });
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

  const approveMutation = useMutation({
    mutationFn: async ({ id, technicianId, scheduledDate, urgency }: { id: string; technicianId: string; scheduledDate: string; urgency: string }) => {
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
      setApproveDialog(null);
      resetApproveForm();
      toast({ title: "Request Approved", description: "The request has been scheduled successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve request.", variant: "destructive" });
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
      toast({ title: "Request Denied", description: "The request has been denied." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deny request.", variant: "destructive" });
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
      toast({ title: "Request Closed", description: "The request has been marked as closed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to close request.", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; name: string; role: string }) => {
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
      setUserDialog(null);
      resetUserForm();
      toast({ title: "User Created", description: "New user has been created successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; role?: string; password?: string } }) => {
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
      toast({ title: "User Updated", description: "User has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
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
      toast({ title: "User Deleted", description: "User has been deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      toast({ title: "PM Schedule Created", description: "Preventive maintenance schedule created successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create PM schedule.", variant: "destructive" });
    },
  });

  const handleApprove = () => {
    if (!approveDialog || !technicianToAssign || !scheduledDate) return;
    approveMutation.mutate({ 
      id: approveDialog.id, 
      technicianId: technicianToAssign, 
      scheduledDate,
      urgency
    });
  };

  const handleDeny = () => {
    if (!denyDialog || !denyReason) return;
    denyMutation.mutate({ id: denyDialog.id, reason: denyReason });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      username: newUsername,
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
      tasks: pmTasks.split('\n').filter(t => t.trim()),
      estimatedDuration: parseInt(pmDuration) || 60,
    });
  };

  const resetApproveForm = () => {
    setTechnicianToAssign("");
    setScheduledDate("");
    setUrgency("standstill");
  };

  const resetUserForm = () => {
    setNewUsername("");
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
    setUserDialog({ mode: 'edit', user });
    setNewName(user.name);
    setNewRole(user.role);
    setNewPassword("");
  };

  const statCards = [
    { label: "Total Requests", value: stats?.requests.total || 0, icon: BarChart3, color: "text-blue-600 bg-blue-100" },
    { label: "Pending", value: stats?.requests.pending || 0, icon: Clock, color: "text-yellow-600 bg-yellow-100" },
    { label: "Closed", value: stats?.requests.closed || 0, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
    { label: "Technicians", value: stats?.technicians || 0, icon: Users, color: "text-purple-600 bg-purple-100" },
  ];

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
        <h1 className="text-3xl font-heading font-bold text-foreground">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage requests, users, and preventive maintenance schedules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="pm" className="gap-2">
            <Wrench className="w-4 h-4" />
            PM Schedules
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Settings className="w-4 h-4" />
            Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Work Requests</CardTitle>
            </CardHeader>
            <CardContent>
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
                    <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                      <TableCell className="font-mono text-xs">{req.tswrNo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{req.assetName}</span>
                          <span className="text-xs text-muted-foreground">{req.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {getUrgencyLabel(req.urgency)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(req.status)}>
                          {getStatusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.assignedTo || <span className="text-muted-foreground italic">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        {req.requesterFeedback ? (
                          <span className="text-sm text-green-600">{req.requesterFeedback.substring(0, 30)}...</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {req.status === 'pending' && (
                          <>
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
                        {(req.status === 'resolved' && req.requesterConfirmedAt) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCloseDialog(req)}
                            data-testid={`button-close-${req.id}`}
                          >
                            Close
                          </Button>
                        )}
                        {req.status === 'closed' && req.turnaroundTime && (
                          <span className="text-xs text-muted-foreground">
                            {req.turnaroundTime}h turnaround
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pm" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preventive Maintenance Schedules</CardTitle>
              <Button onClick={() => setPmDialog(true)} className="gap-2" data-testid="button-add-pm">
                <Plus className="w-4 h-4" />
                Add PM Schedule
              </Button>
            </CardHeader>
            <CardContent>
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
                      <TableCell className="font-mono text-xs">{pm.scheduleId}</TableCell>
                      <TableCell>{pm.assetName}</TableCell>
                      <TableCell>{pm.description}</TableCell>
                      <TableCell className="capitalize">{pm.frequency.replace('_', ' ')}</TableCell>
                      <TableCell>{new Date(pm.nextDueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{pm.assignedToName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button onClick={() => setUserDialog({ mode: 'create' })} className="gap-2" data-testid="button-add-user">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-mono">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600"
                          onClick={() => deleteUserMutation.mutate(user._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.assetId}>
                      <TableCell className="font-mono text-xs">{asset.assetId}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell className="capitalize">{asset.category}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${asset.healthScore >= 80 ? 'bg-green-500' : asset.healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${asset.healthScore}%` }}
                            />
                          </div>
                          <span className="text-xs">{asset.healthScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{asset.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>${asset.currentValue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Schedule Request</DialogTitle>
            <DialogDescription>
              Assign a technician and schedule the maintenance for <strong>{approveDialog?.assetName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Technician</label>
              <Select value={technicianToAssign} onValueChange={setTechnicianToAssign}>
                <SelectTrigger data-testid="select-technician">
                  <SelectValue placeholder="Select technician..." />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input 
                type="date" 
                value={scheduledDate} 
                onChange={(e) => setScheduledDate(e.target.value)}
                data-testid="input-scheduled-date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urgency</label>
              <Select value={urgency} onValueChange={(v: UrgencyType) => setUrgency(v)}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
            <Button 
              onClick={handleApprove} 
              disabled={!technicianToAssign || !scheduledDate || approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={!!denyDialog} onOpenChange={(open) => !open && setDenyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying the request for <strong>{denyDialog?.assetName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Reason for denial..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-deny-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleDeny} 
              disabled={!denyReason || denyMutation.isPending}
              data-testid="button-confirm-deny"
            >
              {denyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={!!closeDialog} onOpenChange={(open) => !open && setCloseDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Request</DialogTitle>
            <DialogDescription>
              The requester has confirmed completion. Do you want to close this request?
            </DialogDescription>
          </DialogHeader>
          {closeDialog?.requesterFeedback && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Requester Feedback:</p>
              <div className="bg-muted p-3 rounded-md text-sm">
                {closeDialog.requesterFeedback}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(null)}>Cancel</Button>
            <Button 
              onClick={() => closeDialog && closeMutation.mutate(closeDialog.id)} 
              disabled={closeMutation.isPending}
              data-testid="button-confirm-close"
            >
              {closeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Close Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={!!userDialog} onOpenChange={(open) => !open && setUserDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userDialog?.mode === 'create' ? 'Create New User' : 'Edit User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={userDialog?.mode === 'create' ? handleCreateUser : handleUpdateUser}>
            <div className="space-y-4 py-4">
              {userDialog?.mode === 'create' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    data-testid="input-username"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required={userDialog?.mode === 'create'}
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password {userDialog?.mode === 'edit' && '(leave blank to keep current)'}</label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required={userDialog?.mode === 'create'}
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger data-testid="select-role">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserDialog(null)}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                data-testid="button-save-user"
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {userDialog?.mode === 'create' ? 'Create User' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PM Schedule Dialog */}
      <Dialog open={pmDialog} onOpenChange={setPmDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create PM Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePm}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset</label>
                <Select value={pmAssetId} onValueChange={setPmAssetId}>
                  <SelectTrigger data-testid="select-pm-asset">
                    <SelectValue placeholder="Select asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.assetId} value={asset.assetId}>
                        {asset.assetId} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={pmDescription}
                  onChange={(e) => setPmDescription(e.target.value)}
                  placeholder="Describe the maintenance activity..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select value={pmFrequency} onValueChange={setPmFrequency}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Due Date</label>
                  <Input 
                    type="date"
                    value={pmNextDueDate}
                    onChange={(e) => setPmNextDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Technician</label>
                  <Select value={pmTechnicianId} onValueChange={setPmTechnicianId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Est. Duration (min)</label>
                  <Input 
                    type="number"
                    value={pmDuration}
                    onChange={(e) => setPmDuration(e.target.value)}
                    min="15"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tasks (one per line)</label>
                <Textarea 
                  value={pmTasks}
                  onChange={(e) => setPmTasks(e.target.value)}
                  placeholder="Check oil levels&#10;Inspect belts&#10;Clean filters"
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPmDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!pmAssetId || !pmDescription || createPmMutation.isPending}>
                {createPmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
