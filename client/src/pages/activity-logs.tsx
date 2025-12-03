import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Wrench, FileText, Settings } from "lucide-react";

export default function ActivityLogsPage() {
  const activities = [
    {
      id: 1,
      action: "Work Request Created",
      user: "John Doe",
      details: "Created TSWR-24-001 for Air Compressor Unit",
      timestamp: new Date().toISOString(),
      icon: Wrench,
      color: "text-blue-500",
    },
    {
      id: 2,
      action: "Request Approved",
      user: "Admin Manager",
      details: "Approved and assigned TSWR-24-001 to Tech Smith",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      icon: FileText,
      color: "text-green-500",
    },
    {
      id: 3,
      action: "User Created",
      user: "Admin Manager",
      details: "Created new technician account for James Wilson",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      icon: User,
      color: "text-purple-500",
    },
    {
      id: 4,
      action: "Asset Updated",
      user: "Tech Smith",
      details: "Updated health score for EQP-001",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      icon: Settings,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8" />
          Activity Logs
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all system activities and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${activity.color}`}
                  >
                    <activity.icon className="w-5 h-5" />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="absolute top-10 left-1/2 w-px h-6 bg-border -translate-x-1/2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{activity.action}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.details}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    By {activity.user}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
