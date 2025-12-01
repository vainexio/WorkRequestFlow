import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ListTodo, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import logoImage from "@assets/generated_images/abstract_geometric_blue_tech_logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const employeeLinks = [
    { href: "/dashboard", label: "My Requests", icon: ListTodo },
    { href: "/dashboard/new", label: "New Request", icon: PlusCircle },
  ];

  const technicianLinks = [
    { href: "/dashboard", label: "Assigned Tasks", icon: Briefcase },
    { href: "/dashboard/completed", label: "History", icon: ListTodo },
  ];

  const managerLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/all-requests", label: "All Requests", icon: ListTodo },
    { href: "/dashboard/staff", label: "Staff", icon: Users },
  ];

  const links = user.role === "manager" 
    ? managerLinks 
    : user.role === "technician" 
    ? technicianLinks 
    : employeeLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <img src={logoImage} alt="WorkQuest" className="w-8 h-8 rounded-md" />
        <span className="font-heading font-bold text-xl tracking-tight text-sidebar-foreground">WorkQuest</span>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <Icon className="w-4 h-4" />
                {link.label}
              </a>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" 
          onClick={() => logout()}
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="WorkQuest" className="w-8 h-8 rounded-md" />
          <span className="font-heading font-bold text-lg">WorkQuest</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-200 ease-in-out">
        <div className="h-full p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
