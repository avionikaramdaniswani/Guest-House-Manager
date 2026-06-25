import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useEffect, Component, type ReactNode } from "react";
import { AuthProvider, useAuth, type UserRole } from "@/contexts/auth-context";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:12, fontFamily:"sans-serif" }}>
          <p style={{ color:"#6b7280", fontSize:14 }}>Terjadi kesalahan. Silakan muat ulang halaman.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ fontSize:13, color:"#0C447C", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FloorPlan from "@/pages/floor-plan";
import Guests from "@/pages/guests";
import Reports from "@/pages/reports";
import ActivityLog from "@/pages/activity-log";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1500,
      staleTime: 10_000,
    },
  },
});

const routeRoles: Record<string, UserRole[]> = {
  "/":             ["viewer", "operator", "admin"],
  "/floor-plan":   ["viewer", "operator", "admin"],
  "/guests":       ["operator", "admin"],
  "/reports":      ["viewer", "admin"],
  "/activity-log": ["admin"],
  "/settings":     ["admin"],
};

function ProtectedRoute({
  component: Component,
  path,
}: {
  component: React.ComponentType;
  path: string;
}) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, canAccess } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    const allowed = routeRoles[path] ?? [];
    if (allowed.length > 0 && !canAccess(allowed)) {
      setLocation("/");
    }
  }, [isAuthenticated, location]);

  if (!isAuthenticated) return null;

  const allowed = routeRoles[path] ?? [];
  if (allowed.length > 0 && !canAccess(allowed)) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/"           component={() => <ProtectedRoute path="/"           component={Dashboard} />} />
      <Route path="/floor-plan" component={() => <ProtectedRoute path="/floor-plan" component={FloorPlan} />} />
      <Route path="/guests"     component={() => <ProtectedRoute path="/guests"     component={Guests} />} />
      <Route path="/reports"      component={() => <ProtectedRoute path="/reports"      component={Reports} />} />
      <Route path="/activity-log" component={() => <ProtectedRoute path="/activity-log" component={ActivityLog} />} />
      <Route path="/settings"     component={() => <ProtectedRoute path="/settings"     component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
