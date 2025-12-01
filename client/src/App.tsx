import { Switch, Route, useLocation } from "wouter";
import { AuthProvider, useAuth } from "@/lib/use-auth";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "@/pages/auth-page";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ManagerDashboard from "@/pages/manager-dashboard";
import TechnicianDashboard from "@/pages/technician-dashboard";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Simple role check - in a real app this would be more robust
  // For this mockup, if a role is provided, we check it. 
  // If not, any logged in user can access (but we route them to their specific dashboard anyway)
  
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user } = useAuth();

  // Helper to route to the correct dashboard based on role
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
      
      {/* Sub-routes for specific views could be added here, 
          but for this mockup we'll stick to the main dashboard views 
      */}
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
    <AuthProvider>
        <Toaster />
        <Router />
    </AuthProvider>
  );
}

export default App;
