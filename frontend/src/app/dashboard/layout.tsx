'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthStore, UserProfile } from '@/store/auth-store';
import {
  LayoutDashboard,
  Database,
  FileCheck,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Sparkles,
  Menu,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // If user is already in store, no need to fetch
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiClient.get('/api/auth/me');
        setUser(userData as UserProfile);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user, setUser, router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      clearUser();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md px-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  const isActivePage = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              FlowShare
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/dashboard/production"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard/production')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Production Data</span>
            </Link>
            <Link
              href="/dashboard/reconciliation"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard/reconciliation')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <FileCheck className="h-5 w-5" />
              <span>Reconciliation</span>
            </Link>
            <Link
              href="/dashboard/team"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard/team')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Team</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard/analytics')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Link>

            <Separator className="my-4" />

            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                isActivePage('/dashboard/settings')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* User Info */}
          <div className="border-t border-border p-4">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {user?.role || 'User'}
                </Badge>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-lg px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search production data, partners..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
          </Button>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogoutModalOpen(true)}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to sign in again to access your
              account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={loggingOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
