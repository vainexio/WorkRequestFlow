import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkRequest } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Clock, CheckCircle2, Users, Loader2 } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  username: string;
}

export default function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<WorkRequest | null>(null);
  const [technicianToAssign, setTechnicianToAssign] = useState("");

  const { data: requests = [], isLoading } = useQuery<WorkRequest[]>({
    queryKey: ["requests"],
    queryFn: async () => {
      const response = await fetch("/api/requests", {
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

  const assignMutation = useMutation({
    mutationFn: async ({ id, technicianName }: { id: string; technicianName: string }) => {
      const response = await fetch(`/api/requests/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ technicianName }),
      });
      if (!response.ok) throw new Error("Failed to assign technician");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setSelectedRequest(null);
      setTechnicianToAssign("");
      toast({
        title: "Technician Assigned",
        description: "The request has been assigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign technician. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedRequest || !technicianToAssign) return;
    assignMutation.mutate({ id: selectedRequest.id, technicianName: technicianToAssign });
  };

  const stats = [
    { label: "Total Requests", value: requests.length, icon: BarChart3, color: "text-blue-600 bg-blue-100" },
    { label: "Pending", value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: "text-yellow-600 bg-yellow-100" },
    { label: "Completed", value: requests.filter(r => r.status === 'completed').length, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
    { label: "Technicians", value: technicians.length, icon: Users, color: "text-purple-600 bg-purple-100" },
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
        <h1 className="text-3xl font-heading font-bold text-foreground">Manager Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor work requests and manage technician assignments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                  <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-id-${req.id}`}>{req.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium" data-testid={`text-title-${req.id}`}>{req.title}</span>
                      <span className="text-xs text-muted-foreground">{req.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.priority === 'critical' || req.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                      {req.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-background" data-testid={`badge-status-${req.id}`}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                          {req.assignedTo.charAt(0)}
                        </div>
                        <span className="text-sm" data-testid={`text-assigned-${req.id}`}>{req.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={selectedRequest?.id === req.id} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedRequest(req)}
                          disabled={!!req.assignedTo}
                          data-testid={`button-assign-${req.id}`}
                        >
                          {req.assignedTo ? "Assigned" : "Assign"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Technician</DialogTitle>
                          <DialogDescription>
                            Select a technician to handle request <strong>{req.id}</strong>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Technician</label>
                            <Select onValueChange={setTechnicianToAssign} value={technicianToAssign}>
                              <SelectTrigger data-testid="select-technician">
                                <SelectValue placeholder="Select technician..." />
                              </SelectTrigger>
                              <SelectContent>
                                {technicians.map((tech) => (
                                  <SelectItem key={tech.id} value={tech.name}>
                                    {tech.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                          <Button 
                            onClick={handleAssign} 
                            disabled={!technicianToAssign || assignMutation.isPending}
                            data-testid="button-confirm-assign"
                          >
                            {assignMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                              </>
                            ) : (
                              "Confirm Assignment"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
