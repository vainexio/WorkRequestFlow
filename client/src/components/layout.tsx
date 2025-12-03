import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ClipboardList,
  Wrench,
  Package,
  Calendar,
  FileText,
  Bell,
  Activity,
  BarChart3,
  LogOut, 
  Menu, 
  Search,
  ChevronDown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoImage from "@assets/generated_images/abstract_geometric_blue_tech_logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const managerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/work-requests", label: "Work Requests", icon: ClipboardList },
    { href: "/dashboard/work-orders", label: "Work Orders", icon: Wrench },
    { href: "/dashboard/assets", label: "Assets", icon: Package },
    { href: "/dashboard/preventive-maintenance", label: "Preventive Maintenance", icon: Calendar },
    { href: "/dashboard/service-reports", label: "Service Reports", icon: FileText },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/activity-logs", label: "Activity Logs", icon: Activity },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const technicianLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/work-orders", label: "My Work Orders", icon: Wrench },
    { href: "/dashboard/service-reports", label: "Service Reports", icon: FileText },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  ];

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/work-requests", label: "My Requests", icon: ClipboardList },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  ];

  const links = user.role === "manager" 
    ? managerLinks 
    : user.role === "technician" 
    ? technicianLinks 
    : employeeLinks;

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      manager: "Manager",
      technician: "Technician",
      employee: "Employee"
    };
    return labels[role] || role;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <img src={logoImage} alt="WorkQuest" className="w-8 h-8 rounded-md" />
        <span className="font-heading font-bold text-xl tracking-tight text-sidebar-foreground">WorkQuest</span>
      </div>
      
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || 
            (link.href !== "/dashboard" && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href}>
              <span 
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" 
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsMobileOpen(true)}
                data-testid="button-mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search requests, assets, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-2 md:px-3"
                    data-testid="button-user-menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium leading-none">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="w-fit mt-1 text-xs capitalize">
                        {user.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 transition-all duration-200 ease-in-out">
          <div className="h-full p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
