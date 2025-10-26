"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  Database,
  FileCheck,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Droplets,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Dashboard Content */}
      <main className="p-6 space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, {user?.full_name || user?.email?.split("@")[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's what's happening with your operations today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 2xl:gap-6 md:grid-cols-3">
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Production
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">124,589</div>
              <p className="text-xs text-muted-foreground mt-1">
                BBL this month
              </p>
              <div className="flex items-center gap-2 mt-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">+12.5%</span>
                <span className="text-sm text-muted-foreground">
                  from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Reconciliations
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
              <div className="flex items-center gap-2 mt-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  3 pending review
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Anomalies Detected
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
              <div className="flex items-center gap-2 mt-3">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">-40%</span>
                <span className="text-sm text-muted-foreground">
                  from last month
                </span>
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
              <CardDescription>
                Submit and manage production entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/production">
                <Button
                  className="w-full group-hover:shadow-lg transition-all"
                  size="lg"
                >
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
              <CardDescription>
                View and trigger reconciliations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/reconciliation">
                <Button
                  className="w-full group-hover:shadow-lg transition-all"
                  size="lg"
                >
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
              <CardDescription>
                View production trends and forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/analytics">
                <Button
                  className="w-full group-hover:shadow-lg transition-all"
                  size="lg"
                >
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
              <CardDescription>
                Latest production entries and reconciliations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    action: "Production entry submitted",
                    time: "2 minutes ago",
                    status: "success",
                  },
                  {
                    action: "Reconciliation completed",
                    time: "1 hour ago",
                    status: "success",
                  },
                  {
                    action: "Anomaly detected in entry #1234",
                    time: "3 hours ago",
                    status: "warning",
                  },
                  {
                    action: "Partner invited to tenant",
                    time: "5 hours ago",
                    status: "info",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.status === "success"
                          ? "bg-success"
                          : item.status === "warning"
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Invite partners and manage users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">Coordinator</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      SM
                    </AvatarFallback>
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
  );
}
