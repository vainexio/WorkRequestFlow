import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkRequest, Asset, UrgencyType, getStatusColor, getStatusLabel, getUrgencyLabel, getUrgencyColor } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, Calendar, MapPin, Wrench, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/use-auth";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<WorkRequest | null>(null);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("standstill");
  const [disruptsOperation, setDisruptsOperation] = useState(false);

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

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: { 
      assetId: string; 
      workDescription: string; 
      urgency: UrgencyType; 
      disruptsOperation: boolean;
    }) => {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "TSWR Submitted",
        description: "Your Technical Service Work Request has been logged successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      const response = await fetch(`/api/requests/${id}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) throw new Error("Failed to confirm completion");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setConfirmDialog(null);
      setFeedback("");
      toast({
        title: "Completion Confirmed",
        description: "Thank you for confirming the work completion.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm completion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast({
        title: "Error",
        description: "Please select an asset",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate({ 
      assetId: selectedAssetId,
      workDescription, 
      urgency, 
      disruptsOperation 
    });
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;
    confirmMutation.mutate({ id: confirmDialog.id, feedback });
  };

  const resetForm = () => {
    setSelectedAssetId("");
    setWorkDescription("");
    setUrgency("standstill");
    setDisruptsOperation(false);
  };

  const selectedAsset = assets.find(a => a.assetId === selectedAssetId);

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold">Technical Service Work Request</h1>
            <p className="text-muted-foreground mt-1">Form No. 505002/1</p>
          </div>
          <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Equipment/Machine/Furniture *</label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                  <SelectTrigger data-testid="select-asset">
                    <SelectValue placeholder="Select an asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.assetId} value={asset.assetId}>
                        {asset.assetId} - {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAsset && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mt-2">
                    <p><strong>Location:</strong> {selectedAsset.location}</p>
                    <p><strong>Category:</strong> {selectedAsset.category}</p>
                    <p><strong>Health Score:</strong> {selectedAsset.healthScore}%</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency *</label>
                <Select value={urgency} onValueChange={(v: UrgencyType) => setUrgency(v)}>
                  <SelectTrigger data-testid="select-urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standstill">Stand Still (Not Urgent - For Schedule)</SelectItem>
                    <SelectItem value="immediately">Immediately (Must be done ASAP)</SelectItem>
                    <SelectItem value="on_occasion">On Occasion (During shutdown/holidays)</SelectItem>
                    <SelectItem value="during_maintenance">During Maintenance (Regular schedule)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Description *</label>
                <Textarea 
                  placeholder="Describe the issue or work to be performed..." 
                  className="min-h-[120px]"
                  value={workDescription} 
                  onChange={(e) => setWorkDescription(e.target.value)} 
                  required 
                  data-testid="textarea-description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="disrupts" 
                  checked={disruptsOperation}
                  onCheckedChange={(checked) => setDisruptsOperation(checked as boolean)}
                  data-testid="checkbox-disrupts"
                />
                <label htmlFor="disrupts" className="text-sm font-medium cursor-pointer">
                  This issue disrupts normal operations
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={createRequestMutation.isPending || !selectedAssetId} data-testid="button-submit-request">
                  {createRequestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit TSWR"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">Track and manage your work requests.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2" data-testid="button-new-request">
          <Plus className="w-4 h-4" />
          New TSWR
        </Button>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No requests yet. Click "New TSWR" to create your first work request.
          </div>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-all duration-200" data-testid={`card-request-${req.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground" data-testid={`text-id-${req.id}`}>
                        {req.tswrNo}
                      </span>
                      <Badge variant="outline" className={getStatusColor(req.status)} data-testid={`badge-status-${req.id}`}>
                        {getStatusLabel(req.status)}
                      </Badge>
                      <Badge className={getUrgencyColor(req.urgency)}>
                        {getUrgencyLabel(req.urgency)}
                      </Badge>
                      {req.disruptsOperation && (
                        <Badge variant="destructive" className="flex gap-1 items-center">
                          <AlertCircle className="w-3 h-3" /> Disrupts Ops
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-primary" />
                        {req.assetName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{req.workDescription}</p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {req.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submitted {new Date(req.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {req.scheduledDate && (
                      <div className="text-sm bg-blue-50 text-blue-700 p-2 rounded inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Scheduled for: {new Date(req.scheduledDate).toLocaleDateString()}
                      </div>
                    )}

                    {req.assignedTo && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Assigned to:</span>
                        <span className="font-medium">{req.assignedTo}</span>
                      </div>
                    )}

                    {req.denialReason && (
                      <div className="text-sm bg-red-50 text-red-700 p-2 rounded">
                        <strong>Reason:</strong> {req.denialReason}
                      </div>
                    )}

                    {req.requesterConfirmedAt && (
                      <div className="text-sm bg-green-50 text-green-700 p-2 rounded flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmed on {new Date(req.requesterConfirmedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {req.status === 'resolved' && !req.requesterConfirmedAt && req.submittedById === user?.id && (
                    <div className="flex-shrink-0">
                      <Button 
                        onClick={() => setConfirmDialog(req)} 
                        className="gap-2"
                        data-testid={`button-confirm-${req.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Completion
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Work Completion</DialogTitle>
            <DialogDescription>
              Please verify that the work on <strong>{confirmDialog?.assetName}</strong> has been completed satisfactorily.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback (visible to manager only)
              </label>
              <Textarea 
                placeholder="Provide feedback about the work performed..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-feedback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button 
              onClick={handleConfirm} 
              disabled={confirmMutation.isPending}
              data-testid="button-submit-confirm"
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Completion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
