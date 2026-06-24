import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, type UserRole } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Map,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { useTheme } from "next-themes";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard, roles: ["viewer", "operator", "admin"] },
  { href: "/floor-plan",   label: "Denah Lantai", icon: Map,             roles: ["viewer", "operator", "admin"] },
  { href: "/guests",       label: "Tamu",         icon: Users,           roles: ["operator", "admin"] },
  { href: "/reports",      label: "Laporan",      icon: BarChart3,       roles: ["viewer", "admin"] },
  { href: "/activity-log", label: "Log Aktivitas",icon: ClipboardList,   roles: ["admin"] },
  { href: "/settings",     label: "Pengaturan",   icon: Settings,        roles: ["admin"] },
];

const roleBadgeColor: Record<UserRole, string> = {
  admin:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  operator: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  viewer:   "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300",
};

const roleLabel: Record<UserRole, string> = {
  admin:    "Admin",
  operator: "Operator",
  viewer:   "Viewer",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

function NavLinks({
  location,
  collapsed,
  visibleItems,
  onNav,
}: {
  location: string;
  collapsed: boolean;
  visibleItems: NavItem[];
  onNav?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 min-h-0">
      {visibleItems.map((item) => {
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

function ProfileCard({
  collapsed,
  onLogout,
}: {
  collapsed: boolean;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const initials = getInitials(user.name);

  if (collapsed) {
    return (
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-sidebar-border flex flex-col items-center gap-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "var(--sidebar-primary, #0C447C)" }}
          title={user.name}
        >
          {initials}
        </div>
        <button
          onClick={onLogout}
          title="Keluar"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-[16px] h-[16px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-3 pb-4 pt-2 border-t border-sidebar-border">
      <div className="rounded-xl bg-sidebar-accent/40 border border-sidebar-border px-3 py-3 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "var(--sidebar-primary, #0C447C)" }}
        >
          {initials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">{user.name}</p>
          <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${roleBadgeColor[user.role]}`}>
            {roleLabel[user.role]}
          </span>
        </div>

        {/* Logout button inside card */}
        <button
          onClick={onLogout}
          title="Keluar"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-[15px] h-[15px]" />
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, canAccess } = useAuth();

  const visibleItems = navItems.filter(item => canAccess(item.roles));

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const isDark = theme === "dark";
  const pageLabel = navItems.find(n => n.href === location)?.label ?? "Wisma Eucaliptus";

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
        <span className="flex-1 font-bold text-sidebar-foreground text-sm tracking-tight">
          Wisma Eucaliptus
        </span>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title={isDark ? "Mode Terang" : "Mode Gelap"}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
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

        {/* Scrollable nav */}
        <NavLinks location={location} collapsed={false} visibleItems={visibleItems} onNav={() => setMobileOpen(false)} />

        {/* Sticky profile card */}
        <ProfileCard collapsed={false} onLogout={handleLogout} />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden h-screen sticky top-0 ${
          collapsed ? "w-[60px]" : "w-60"
        }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center h-14 shrink-0 border-b border-sidebar-border">
          {!collapsed && (
            <div className="text-center px-10">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">Wisma Eucaliptus</p>
              <p className="text-[11px] text-sidebar-foreground/50">Guest House Deluxe</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable nav */}
        <NavLinks location={location} collapsed={collapsed} visibleItems={visibleItems} />

        {/* Sticky profile card */}
        <ProfileCard collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Desktop top navbar */}
        <header className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border bg-background shrink-0">
          <h1 className="text-sm font-semibold text-foreground">{pageLabel}</h1>
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-xs text-muted-foreground mr-1">{user.name}</span>
            )}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Mode Terang" : "Mode Gelap"}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 pt-[72px] md:pt-6 md:px-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
