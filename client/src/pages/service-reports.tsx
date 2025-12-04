import { useQuery } from "@tanstack/react-query";
import { ServiceReport, getUrgencyLabel } from "@/lib/types";
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
import { FileText, Loader2 } from "lucide-react";

export default function ServiceReportsPage() {
  const { data: reports = [], isLoading } = useQuery<ServiceReport[]>({
    queryKey: ["service-reports"],
    queryFn: async () => {
      const response = await fetch("/api/service-reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch service reports");
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
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8" />
          Service Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          View all completed service reports
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Reports</p>
            <p className="text-2xl font-bold">{reports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Planned</p>
            <p className="text-2xl font-bold text-blue-600">
              {reports.filter((r) => r.serviceType === "planned").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unplanned</p>
            <p className="text-2xl font-bold text-orange-600">
              {reports.filter((r) => r.serviceType === "unplanned").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>TSWR No.</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Man Hours</TableHead>
                  <TableHead>Prepared By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.reportId}>
                    <TableCell className="font-mono text-xs">
                      {report.reportId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {report.tswrNo}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{report.assetName}</span>
                        <span className="text-xs text-muted-foreground">
                          {report.location}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {report.workDescription}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`capitalize ${
                          report.serviceType === "planned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {report.serviceType}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.manHours}h</TableCell>
                    <TableCell>{report.preparedByName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(report.serviceDate).toLocaleDateString()}
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
