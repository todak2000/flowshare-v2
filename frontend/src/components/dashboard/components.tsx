import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";

/**
 * Props for the WelcomeHeader component
 */
export interface WelcomeHeaderProps {
  userName: string;
}

/**
 * Displays the main welcome message to the user.
 */
export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <div>
      <h1 className="text-lg font-bold tracking-tight mb-2">
        Welcome back, <span className="text-primary">{userName}</span>! 👋
      </h1>
      <p className="text-muted-foreground text-lg">
        Here's what's happening with your operations today.
      </p>
    </div>
  );
}

/**
 * Props for the StatCard component
 */
export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: React.ReactNode;
}

/**
 * A reusable card for displaying a single, important statistic.
 */
export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {/* Icon is passed in as a complete, styled element */}
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        {/* Trend is passed in as a complete element */}
        {trend}
      </CardContent>
    </Card>
  );
}

/**
 * Props for the ActionCard component
 */
export interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
  buttonText: string;
}

/**
 * A reusable card that links to a primary section of the app.
 */
export function ActionCard({
  title,
  description,
  icon,
  linkHref,
  buttonText,
}: ActionCardProps) {
  return (
    <Card className="border-2 hover:shadow-xl transition-all hover:border-primary/50 group">
      <CardHeader>
        {/* Icon is passed in as a complete, styled element */}
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={linkHref}
          // Style the <a> tag to look like the button
          className="w-full group-hover:shadow-lg transition-all inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background
          bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 group"
        >
          {buttonText}
          {/* Replaced icon with a simple arrow */}
          <span className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

interface Activity {
  action: string;
  time: string;
  status: string;
}

interface RecentActivityCardProps {
  activities?: Activity[];
  isLoading?: boolean;
}

/**
 * A card displaying the most recent activities from audit logs.
 */
export function RecentActivityCard({ activities = [], isLoading = false }: RecentActivityCardProps) {
  const defaultActivities = [
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
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest production entries and reconciliations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          ) : (
            displayActivities.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0"
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  item.status === "success"
                    ? "bg-green-500" // Use direct tailwind colors
                    : item.status === "warning"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface TeamManagementCardProps {
  teamMembers?: TeamMember[];
  isLoading?: boolean;
}

/**
 * A card displaying team members and a link to team management.
 */
export function TeamManagementCard({ teamMembers = [], isLoading = false }: TeamManagementCardProps) {
  const defaultTeamMembers = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "Coordinator", status: "active", fallback: "JD" },
    { id: "2", name: "Sarah Miller", email: "sarah@example.com", role: "Partner", status: "active", fallback: "SM" },
  ];

  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : defaultTeamMembers;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>Invite partners and manage users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading team members...</p>
          ) : (
            displayTeamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
                <Badge variant="success">{member.status === "active" ? "Active" : member.status}</Badge>
              </div>
            ))
          )}
          <Link
            href="/dashboard/team"
            className="w-full mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors
            border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Manage Team
            {/* Removed <Users> icon */}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStats {
  total_production: number;
  production_trend: number;
  active_reconciliations: number;
  pending_reconciliations: number;
  anomalies_detected: number;
  anomalies_trend: number;
  total_entries_this_month: number;
  total_entries_last_month: number;
}

export const getStatCardData = (stats: DashboardStats | null) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(Math.round(num));
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend >= 0;
    const sign = isPositive ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  return [
    {
      title: "Total Production",
      value: stats ? formatNumber(stats.total_production) : "0",
      subtitle: "BBL this month",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <div className="h-5 w-5 rounded bg-primary/50" />
        </div>
      ),
      trend: stats ? (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              stats.production_trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatTrend(stats.production_trend)}
          </span>
          <span className="text-sm text-muted-foreground">from last month</span>
        </div>
      ) : null,
    },
    {
      title: "Active Reconciliations",
      value: stats ? stats.active_reconciliations.toString() : "0",
      subtitle: "In progress",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
          <div className="h-5 w-5 rounded bg-yellow-500/50" />
        </div>
      ),
      trend: stats && stats.pending_reconciliations > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {stats.pending_reconciliations} pending review
          </span>
        </div>
      ) : null,
    },
    {
      title: "AI Anomalies Detected",
      value: stats ? stats.anomalies_detected.toString() : "0",
      subtitle: "Requires attention",
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <div className="h-5 w-5 rounded bg-red-500/50" />
        </div>
      ),
      trend: stats ? (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              stats.anomalies_trend <= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatTrend(stats.anomalies_trend)}
          </span>
          <span className="text-sm text-muted-foreground">from last month</span>
        </div>
      ) : null,
    },
  ];
};

export const statCardData = getStatCardData(null);

export const actionCardData = [
  {
    title: "Production Data",
    description: "Submit and manage production entries",
    linkHref: "/dashboard/production",
    buttonText: "Go to Production",
    icon: (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <div className="h-6 w-6 rounded-md bg-primary/50" />
      </div>
    ),
  },
  {
    title: "Reconciliation",
    description: "View and trigger reconciliations",
    linkHref: "/dashboard/reconciliation",
    buttonText: "Go to Reconciliation",
    icon: (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <div className="h-6 w-6 rounded-md bg-primary/50" />
      </div>
    ),
  },
  {
    title: "Analytics",
    description: "View production trends and forecasts",
    linkHref: "/dashboard/analytics",
    buttonText: "View Analytics",
    icon: (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
        <div className="h-6 w-6 rounded-md bg-primary/50" />
      </div>
    ),
  },
];