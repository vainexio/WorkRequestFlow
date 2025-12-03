import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import TechnicianDashboard from "@/pages/technician-dashboard";
import WorkRequestsPage from "@/pages/work-requests";
import WorkOrdersPage from "@/pages/work-orders";
import AssetsPage from "@/pages/assets";
import PreventiveMaintenancePage from "@/pages/preventive-maintenance";
import ServiceReportsPage from "@/pages/service-reports";
import NotificationsPage from "@/pages/notifications";
import ActivityLogsPage from "@/pages/activity-logs";
import AnalyticsPage from "@/pages/analytics";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    setLocation("/auth");
    return null;
  }
  
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user } = useAuth();

  const DashboardRouter = () => {
    if (!user) return null;
    if (user.role === "manager") return <ManagerDashboard />;
    if (user.role === "technician") return <TechnicianDashboard />;
    return <EmployeeDashboard />;
  };

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardRouter} />
      </Route>

      <Route path="/dashboard/work-requests">
        <ProtectedRoute component={WorkRequestsPage} />
      </Route>

      <Route path="/dashboard/work-orders">
        <ProtectedRoute component={WorkOrdersPage} />
      </Route>

      <Route path="/dashboard/assets">
        <ProtectedRoute component={AssetsPage} />
      </Route>

      <Route path="/dashboard/preventive-maintenance">
        <ProtectedRoute component={PreventiveMaintenancePage} />
      </Route>

      <Route path="/dashboard/service-reports">
        <ProtectedRoute component={ServiceReportsPage} />
      </Route>

      <Route path="/dashboard/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>

      <Route path="/dashboard/activity-logs">
        <ProtectedRoute component={ActivityLogsPage} />
      </Route>

      <Route path="/dashboard/analytics">
        <ProtectedRoute component={AnalyticsPage} />
      </Route>
      
      <Route path="/dashboard/*">
        <ProtectedRoute component={DashboardRouter} />
      </Route>

      <Route path="/">
        {user ? <ProtectedRoute component={DashboardRouter} /> : <AuthPage />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
