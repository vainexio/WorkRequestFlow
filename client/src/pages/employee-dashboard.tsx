import { useState } from "react";
import { mockRequests, WorkRequest, Priority } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeDashboard() {
  const [requests, setRequests] = useState<WorkRequest[]>(mockRequests);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: WorkRequest = {
      id: `REQ-${Math.floor(Math.random() * 10000)}`,
      title,
      location,
      priority,
      description,
      status: "pending",
      submittedBy: "Employee User", // In a real app, this comes from auth
      submittedAt: new Date().toISOString(),
    };

    setRequests([newRequest, ...requests]);
    setIsCreating(false);
    resetForm();
    toast({
      title: "Request Submitted",
      description: "Your work request has been successfully logged.",
    });
  };

  const resetForm = () => {
    setTitle("");
    setLocation("");
    setPriority("medium");
    setDescription("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-600 border-green-200";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-heading font-bold">New Work Request</h1>
          <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="Briefly describe the issue" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium">Location</label>
                   <Input 
                    placeholder="Building, Floor, Room" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    required 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium">Priority</label>
                   <Select value={priority} onValueChange={(v: Priority) => setPriority(v)}>
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="low">Low</SelectItem>
                       <SelectItem value="medium">Medium</SelectItem>
                       <SelectItem value="high">High</SelectItem>
                       <SelectItem value="critical">Critical</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Provide detailed information about the problem..." 
                  className="min-h-[120px]"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" data-testid="button-submit-request">Submit Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">Track the status of your submitted work orders.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2" data-testid="button-new-request">
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.map((req) => (
          <Card key={req.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{req.id}</span>
                    <Badge variant="outline" className={getStatusColor(req.status)}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                    {req.priority === 'critical' && (
                      <Badge variant="destructive" className="flex gap-1 items-center">
                        <AlertTriangle className="w-3 h-3" /> Critical
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{req.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground/80">{req.location}</span>
                    <span>•</span>
                    <span>Submitted {new Date(req.submittedAt).toLocaleDateString()}</span>
                  </p>
                </div>
                
                {req.assignedTo && (
                   <div className="flex items-center gap-3 text-sm bg-secondary/50 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {req.assignedTo.charAt(0)}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Assigned to</p>
                        <p className="font-medium">{req.assignedTo}</p>
                      </div>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
