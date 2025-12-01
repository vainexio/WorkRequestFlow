import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export type UserRole = "employee" | "technician" | "manager";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const login = async (username: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let role: UserRole = "employee";
    let name = "Employee User";

    if (username.toLowerCase().includes("tech")) {
      role = "technician";
      name = "Technician User";
    } else if (username.toLowerCase().includes("manager") || username.toLowerCase().includes("admin")) {
      role = "manager";
      name = "Manager User";
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      role,
      name,
    };

    setUser(newUser);
    setIsLoading(false);
    setLocation("/dashboard");
  };

  const logout = () => {
    setUser(null);
    setLocation("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
