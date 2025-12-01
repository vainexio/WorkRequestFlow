import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/lib/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import TechnicianDashboard from "@/pages/technician-dashboard";
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
