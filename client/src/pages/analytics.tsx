import { useQuery } from "@tanstack/react-query";
import { DashboardStats, Asset } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  if (statsLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalRequests = stats?.requests.total || 0;
  const closedRequests = stats?.requests.closed || 0;
  const completionRate = totalRequests > 0 
    ? Math.round((closedRequests / totalRequests) * 100) 
    : 0;

  const healthyAssets = assets.filter((a) => a.healthScore >= 80).length;
  const warningAssets = assets.filter(
    (a) => a.healthScore >= 50 && a.healthScore < 80
  ).length;
  const criticalAssets = assets.filter((a) => a.healthScore < 50).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Performance metrics and insights
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Turnaround</p>
                <p className="text-2xl font-bold">
                  {stats?.avgTurnaroundHours || 0}h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {completionRate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Denied Requests</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.requests.denied || 0}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cannot Resolve</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.requests.cannotResolve || 0}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending</span>
                <span>{stats?.requests.pending || 0}</span>
              </div>
              <Progress
                value={
                  totalRequests > 0
                    ? ((stats?.requests.pending || 0) / totalRequests) * 100
                    : 0
                }
                className="h-2 [&>div]:bg-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Scheduled</span>
                <span>{stats?.requests.scheduled || 0}</span>
              </div>
              <Progress
                value={
                  totalRequests > 0
                    ? ((stats?.requests.scheduled || 0) / totalRequests) * 100
                    : 0
                }
                className="h-2 [&>div]:bg-slate-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Ongoing</span>
                <span>{stats?.requests.ongoing || 0}</span>
              </div>
              <Progress
                value={
                  totalRequests > 0
                    ? ((stats?.requests.ongoing || 0) / totalRequests) * 100
                    : 0
                }
                className="h-2 [&>div]:bg-yellow-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Resolved</span>
                <span>{stats?.requests.resolved || 0}</span>
              </div>
              <Progress
                value={
                  totalRequests > 0
                    ? ((stats?.requests.resolved || 0) / totalRequests) * 100
                    : 0
                }
                className="h-2 [&>div]:bg-green-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Closed</span>
                <span>{stats?.requests.closed || 0}</span>
              </div>
              <Progress
                value={
                  totalRequests > 0
                    ? ((stats?.requests.closed || 0) / totalRequests) * 100
                    : 0
                }
                className="h-2 [&>div]:bg-gray-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Health Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span>Healthy (80%+)</span>
                  <span className="font-bold text-green-600">
                    {healthyAssets}
                  </span>
                </div>
                <Progress
                  value={
                    assets.length > 0
                      ? (healthyAssets / assets.length) * 100
                      : 0
                  }
                  className="h-2 mt-2 [&>div]:bg-green-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span>Warning (50-79%)</span>
                  <span className="font-bold text-yellow-600">
                    {warningAssets}
                  </span>
                </div>
                <Progress
                  value={
                    assets.length > 0
                      ? (warningAssets / assets.length) * 100
                      : 0
                  }
                  className="h-2 mt-2 [&>div]:bg-yellow-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span>Critical (&lt;50%)</span>
                  <span className="font-bold text-red-600">
                    {criticalAssets}
                  </span>
                </div>
                <Progress
                  value={
                    assets.length > 0
                      ? (criticalAssets / assets.length) * 100
                      : 0
                  }
                  className="h-2 mt-2 [&>div]:bg-red-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
