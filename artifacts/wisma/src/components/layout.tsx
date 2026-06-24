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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

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

function NavLinks({
  location,
  collapsed,
  onNav,
}: {
  location: string;
  collapsed: boolean;
  onNav?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-2 space-y-0.5">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              collapsed ? "justify-center" : ""
            } ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-background flex w-full">

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-3 gap-2">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-sidebar-foreground text-sm tracking-tight">
          Wisma Eucaliptus
        </span>
      </header>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-250 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border shrink-0">
          <div>
            <p className="text-sm font-bold text-sidebar-foreground leading-tight">Wisma Eucaliptus</p>
            <p className="text-[11px] text-sidebar-foreground/50">Guest House Deluxe</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <NavLinks location={location} collapsed={false} onNav={() => setMobileOpen(false)} />
        {/* Mobile footer */}
        <div className="px-3 pb-4 pt-2 border-t border-sidebar-border shrink-0 space-y-0.5">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            {isDark ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
            <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden ${
          collapsed ? "w-[60px]" : "w-60"
        }`}
      >
        {/* Desktop header row */}
        <div className={`flex items-center h-14 shrink-0 border-b border-sidebar-border ${collapsed ? "justify-center px-0" : "px-4 gap-2"}`}>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Wisma Eucaliptus</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">Guest House Deluxe</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors shrink-0"
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>

        <NavLinks location={location} collapsed={collapsed} />

        {/* Desktop footer */}
        <div className={`px-3 pb-4 pt-2 border-t border-sidebar-border shrink-0 space-y-0.5 ${collapsed ? "px-2" : ""}`}>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={collapsed ? (isDark ? "Mode Terang" : "Mode Gelap") : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center px-0" : ""}`}
          >
            {isDark ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
            {!collapsed && <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? "Keluar" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center px-0" : ""}`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-auto p-4 pt-[72px] md:pt-6 md:px-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
