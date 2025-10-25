'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  LayoutDashboard,
  Database,
  FileCheck,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Droplets,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Menu,
  LogOut
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get('/api/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen w-72 bg-card border-r border-border transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
            <Link href="/dashboard" className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-primary font-medium transition-all hover:bg-primary/20">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/production" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground">
              <Database className="h-5 w-5" />
              <span>Production Data</span>
            </Link>
            <Link href="/dashboard/reconciliation" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground">
              <FileCheck className="h-5 w-5" />
              <span>Reconciliation</span>
            </Link>
            <Link href="/dashboard/team" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground">
              <Users className="h-5 w-5" />
              <span>Team</span>
            </Link>
            <Link href="/dashboard/analytics" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground">
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Link>

            <Separator className="my-4" />

            <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* User Info */}
          <div className="border-t border-border p-4">
            <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">{user?.role || 'User'}</Badge>
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogoutModalOpen(true)}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {user?.email?.split('@')[0]}! 👋</h1>
            <p className="text-muted-foreground text-lg">Here's what's happening with your operations today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Production</CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">124,589</div>
                <p className="text-xs text-muted-foreground mt-1">BBL this month</p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">+12.5%</span>
                  <span className="text-sm text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Reconciliations</CardTitle>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">In progress</p>
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">3 pending review</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Anomalies Detected</CardTitle>
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">-40%</span>
                  <span className="text-sm text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground mt-1">Allocation accuracy</p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">+0.3%</span>
                  <span className="text-sm text-muted-foreground">improvement</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-2 hover:shadow-xl transition-all hover:border-primary/50 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Production Data</CardTitle>
                <CardDescription>Submit and manage production entries</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/production">
                  <Button className="w-full group-hover:shadow-lg transition-all" size="lg">
                    Go to Production
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:border-primary/50 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Reconciliation</CardTitle>
                <CardDescription>View and trigger reconciliations</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/reconciliation">
                  <Button className="w-full group-hover:shadow-lg transition-all" size="lg">
                    Go to Reconciliation
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all hover:border-primary/50 group">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Analytics</CardTitle>
                <CardDescription>View production trends and forecasts</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/analytics">
                  <Button className="w-full group-hover:shadow-lg transition-all" size="lg">
                    View Analytics
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Team */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest production entries and reconciliations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Production entry submitted', time: '2 minutes ago', status: 'success' },
                    { action: 'Reconciliation completed', time: '1 hour ago', status: 'success' },
                    { action: 'Anomaly detected in entry #1234', time: '3 hours ago', status: 'warning' },
                    { action: 'Partner invited to tenant', time: '5 hours ago', status: 'info' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0">
                      <div className={`h-2 w-2 rounded-full ${
                        item.status === 'success' ? 'bg-success' :
                        item.status === 'warning' ? 'bg-warning' :
                        'bg-primary'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Invite partners and manage users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">John Doe</p>
                      <p className="text-xs text-muted-foreground">Coordinator</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">SM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sarah Miller</p>
                      <p className="text-xs text-muted-foreground">Partner</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <Link href="/dashboard/team">
                    <Button variant="outline" className="w-full mt-2">
                      Manage Team
                      <Users className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
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
              Are you sure you want to logout? You will need to sign in again to access your account.
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
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
