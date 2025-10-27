"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  LayoutDashboard,
  Database,
  FileCheck,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { UserProfile } from "@/store/auth-store";
import { useMemo } from "react";
import { Logo } from "./Logo";

interface SidebarProps {
  user: UserProfile | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  role: "field_operator" | "coordinator" | "partner";
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/production", icon: Database, label: "Production Data" },
  {
    href: "/dashboard/reconciliation",
    icon: FileCheck,
    label: "Reconciliation",
  },
  { href: "/dashboard/team", icon: Users, label: "Team" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/flowsharegpt", icon: BrainCircuit, label: "FlowshareGPT" },
];

const operatorNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/production", icon: Database, label: "Production Data" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/flowsharegpt", icon: BrainCircuit, label: "FlowshareGPT" },
];

const settingsItems = [
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({
  user,
  sidebarOpen,
  setSidebarOpen,
  role,
}: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const userInitials = user?.full_name?.slice(0, 2).toUpperCase() || "U";

  const nav = useMemo(() => {
    return role === "field_operator" ? operatorNavItems : navItems;
  }, [role]);

  const navSettings = useMemo(() => {
    return role === "coordinator" ? settingsItems : [];
  }, [role]);
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border transition-transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <Logo />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}

          <Separator className="my-4" />

          {navSettings.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-border p-4">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <Badge variant="secondary" className="text-xs mt-1 capitalize">
                {user?.role === "field_operator"
                  ? "Field Operator"
                  : user?.role || "User"}
              </Badge>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
