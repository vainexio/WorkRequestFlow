import { useQuery } from "@tanstack/react-query";
import { WorkRequest, getStatusColor, getStatusLabel, getUrgencyLabel } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export default function WorkRequestsPage() {
  const { user } = useAuth();

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
            <ClipboardList className="w-8 h-8" />
            Work Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all work requests
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
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
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
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
                    <TableCell>{req.submittedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.submittedAt).toLocaleDateString()}
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
