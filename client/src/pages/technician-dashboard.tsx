import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkRequest, RequestStatus } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, AlertCircle, Loader2 } from "lucide-react";

export default function TechnicianDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const response = await fetch(`/api/requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({
        title: "Status Updated",
        description: "Request status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
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
        <h1 className="text-3xl font-heading font-bold text-foreground">My Assignments</h1>
        <p className="text-muted-foreground mt-1">Manage your active maintenance tasks.</p>
      </div>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No tasks assigned currently. Good job!
          </div>
        ) : requests.map((req) => (
          <Card key={req.id} className="overflow-hidden group" data-testid={`card-request-${req.id}`}>
            <div className={`h-1.5 w-full ${
              req.priority === 'critical' ? 'bg-red-500' : 
              req.priority === 'high' ? 'bg-orange-500' : 
              'bg-blue-500'
            }`} />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono" data-testid={`text-id-${req.id}`}>{req.id}</Badge>
                        <Badge className={
                          req.priority === 'critical' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                          req.priority === 'high' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : 
                          'bg-slate-100 text-slate-700 hover:bg-slate-100'
                        }>
                          {req.priority} priority
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold" data-testid={`text-title-${req.id}`}>{req.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground bg-muted/30 p-4 rounded-md" data-testid={`text-description-${req.id}`}>
                    {req.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {req.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      Reported by {req.submittedBy}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0 flex flex-col justify-center gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                    <Select 
                      value={req.status} 
                      onValueChange={(v: RequestStatus) => handleStatusChange(req.id, v)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className={
                        req.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' : ''
                      } data-testid={`select-status-${req.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {req.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-2 rounded">
                      Task Completed
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
