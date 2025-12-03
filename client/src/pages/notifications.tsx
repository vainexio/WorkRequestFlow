import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "info",
      title: "System Update",
      message: "The system will be updated this weekend for maintenance.",
      date: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: "warning",
      title: "Asset at Risk",
      message: "EQP-001 health score has dropped below 50%.",
      date: new Date(Date.now() - 86400000).toISOString(),
      read: false,
    },
    {
      id: 3,
      type: "success",
      title: "Work Order Completed",
      message: "TSWR-24-001 has been resolved and closed.",
      date: new Date(Date.now() - 172800000).toISOString(),
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          <Bell className="w-8 h-8" />
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with system alerts and messages
        </p>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${!notification.read ? "border-l-4 border-l-primary" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
