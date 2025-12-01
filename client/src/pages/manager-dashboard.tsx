import { useState } from "react";
import { mockRequests, WorkRequest } from "@/lib/mock-data";
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
import { BarChart3, Clock, CheckCircle2, Users } from "lucide-react";

export default function ManagerDashboard() {
  const [requests, setRequests] = useState<WorkRequest[]>(mockRequests);
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<WorkRequest | null>(null);
  const [technicianToAssign, setTechnicianToAssign] = useState("");

  const handleAssign = () => {
    if (!selectedRequest || !technicianToAssign) return;

    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, assignedTo: technicianToAssign, status: "in_progress" as const } 
        : req
    );

    setRequests(updatedRequests);
    setSelectedRequest(null);
    setTechnicianToAssign("");
    
    toast({
      title: "Technician Assigned",
      description: `${technicianToAssign} has been assigned to ${selectedRequest.id}`,
    });
  };

  const stats = [
    { label: "Total Requests", value: requests.length, icon: BarChart3, color: "text-blue-600 bg-blue-100" },
    { label: "Pending", value: requests.filter(r => r.status === 'pending').length, icon: Clock, color: "text-yellow-600 bg-yellow-100" },
    { label: "Completed", value: requests.filter(r => r.status === 'completed').length, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
    { label: "Active Staff", value: 12, icon: Users, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Manager Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor work requests and manage technician assignments.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
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
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{req.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{req.title}</span>
                      <span className="text-xs text-muted-foreground">{req.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={req.priority === 'critical' || req.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                      {req.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize bg-background">
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {req.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                          {req.assignedTo.charAt(0)}
                        </div>
                        <span className="text-sm">{req.assignedTo}</span>
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
                            <Select onValueChange={setTechnicianToAssign}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select technician..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="John Smith">John Smith (Electrical)</SelectItem>
                                <SelectItem value="Sarah Connor">Sarah Connor (HVAC)</SelectItem>
                                <SelectItem value="Technician User">Technician User (General)</SelectItem>
                                <SelectItem value="Mike Ross">Mike Ross (Plumbing)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                          <Button onClick={handleAssign} disabled={!technicianToAssign}>Confirm Assignment</Button>
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
