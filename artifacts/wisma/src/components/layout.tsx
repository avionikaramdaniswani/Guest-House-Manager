import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/auth";
import {
  LayoutDashboard,
  Map,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/floor-plan", label: "Denah Lantai", icon: Map },
  { href: "/bookings", label: "Pemesanan", icon: CalendarDays },
  { href: "/guests", label: "Tamu", icon: Users },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      <div className={`flex items-center gap-2 p-4 ${collapsed ? "justify-center" : "px-6 py-5"}`}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight truncate">Wisma Eucaliptus</h1>
            <p className="text-xs text-sidebar-primary-foreground/70 truncate">Guest House Deluxe</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`p-2 border-t border-sidebar-border space-y-1 ${collapsed ? "" : "px-2"}`}>
        <Button
          variant="ghost"
          className={`w-full text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground ${
            collapsed ? "justify-center px-0" : "justify-start"
          }`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={collapsed ? (theme === "dark" ? "Mode Terang" : "Mode Gelap") : undefined}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          {!collapsed && <span className="ml-3">{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>}
        </Button>
        <Button
          variant="ghost"
          className={`w-full text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground ${
            collapsed ? "justify-center px-0" : "justify-start"
          }`}
          onClick={handleLogout}
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="ml-3">Keluar</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold text-sidebar-foreground text-base">Wisma Eucaliptus</span>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <div>
            <p className="font-bold text-sidebar-foreground">Wisma Eucaliptus</p>
            <p className="text-xs text-sidebar-primary-foreground/70">Guest House Deluxe</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <SidebarContent onNav={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border relative transition-all duration-300 shrink-0 ${
          collapsed ? "w-[60px]" : "w-64"
        }`}
      >
        <SidebarContent />

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shadow-sm hover:bg-sidebar-accent transition-colors"
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/70" />
            : <ChevronLeft className="w-3.5 h-3.5 text-sidebar-foreground/70" />
          }
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-4 pt-[72px] md:pt-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
