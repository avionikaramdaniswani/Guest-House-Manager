import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken, getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";

export type UserRole = "viewer" | "operator" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  canAccess: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    const t = getToken();
    if (t) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
        });
      } catch (_) {}
    }
    clearToken();
    clearStoredUser();
    setTokenState(null);
    setUser(null);
  };

  const canAccess = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
