import { useQuery } from "@tanstack/react-query";
import { PreventiveMaintenance } from "@/lib/mock-data";
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
import { Calendar, Loader2 } from "lucide-react";

export default function PreventiveMaintenancePage() {
  const { data: schedules = [], isLoading } = useQuery<PreventiveMaintenance[]>({
    queryKey: ["pm-schedules"],
    queryFn: async () => {
      const response = await fetch("/api/pm-schedules", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch PM schedules");
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

  const upcomingThisWeek = schedules.filter((pm) => {
    const dueDate = new Date(pm.nextDueDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= weekFromNow;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          Preventive Maintenance
        </h1>
        <p className="text-muted-foreground mt-1">
          Scheduled maintenance tasks and schedules
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Schedules</p>
            <p className="text-2xl font-bold">{schedules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Due This Week</p>
            <p className="text-2xl font-bold text-yellow-600">
              {upcomingThisWeek.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {schedules.filter((s) => s.isActive).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PM Schedules</CardTitle>
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
                  <TableHead>Last Completed</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((pm) => (
                  <TableRow key={pm.scheduleId}>
                    <TableCell className="font-mono text-xs">
                      {pm.scheduleId}
                    </TableCell>
                    <TableCell>{pm.assetName}</TableCell>
                    <TableCell>{pm.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {pm.frequency.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(pm.nextDueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {pm.lastCompletedDate
                        ? new Date(pm.lastCompletedDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>{pm.assignedToName || "-"}</TableCell>
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
