import { useQuery } from "@tanstack/react-query";
import { WorkRequest, getStatusColor, getStatusLabel, getUrgencyLabel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wrench, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export default function WorkOrdersPage() {
  const { user } = useAuth();

  const { data: requests = [], isLoading } = useQuery<WorkRequest[]>({
    queryKey: ["work-orders"],
    queryFn: async () => {
      const response = await fetch("/api/requests/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch work orders");
      const data = await response.json();
      return data.filter((r: WorkRequest) => 
        r.status === "scheduled" || r.status === "ongoing" || r.status === "resolved"
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
            <Wrench className="w-8 h-8" />
            Work Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Active and completed work orders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold">
              {requests.filter((r) => r.status === "scheduled").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ongoing</p>
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter((r) => r.status === "ongoing").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === "resolved").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TSWR No.</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} data-testid={`row-wo-${req.id}`}>
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
                    <TableCell className="max-w-xs truncate">
                      {req.workDescription}
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
                    <TableCell>{req.assignedTo || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {req.scheduledDate
                        ? new Date(req.scheduledDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
