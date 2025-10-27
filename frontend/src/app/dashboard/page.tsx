"use client";
import { useEffect, useState } from "react";
import {
  ActionCard,
  actionCardData,
  RecentActivityCard,
  StatCard,
  getStatCardData,
  TeamManagementCard,
  WelcomeHeader,
} from "@/components/dashboard/components";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";

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

interface AuditLog {
  id: string;
  action: string;
  user_name: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

/**
 * The main dashboard page, composed of the reusable components defined above.
 */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Centralize the name logic
  const userName = user?.full_name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsData = await apiClient.get<DashboardStats>("/api/dashboard/stats");
        setStats(statsData);

        // Fetch recent activities
        const auditLogs = await apiClient.get<AuditLog[]>("/api/audit-logs/recent?limit=4");
        const formattedActivities = auditLogs.map((log) => ({
          action: formatAction(log.action, log.user_name),
          time: formatTime(log.created_at),
          status: getStatusFromAction(log.action),
        }));
        setActivities(formattedActivities);

        // Fetch team members
        const members = await apiClient.get<TeamMember[]>("/api/dashboard/team-members?limit=2");
        setTeamMembers(members);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatAction = (action: string, userName: string | null) => {
    const actionMap: Record<string, string> = {
      production_entry_created: "Production entry submitted",
      production_entry_updated: "Production entry updated",
      production_entry_flagged: "Anomaly detected",
      reconciliation_created: "Reconciliation started",
      reconciliation_approved: "Reconciliation completed",
      user_invited: "Partner invited to tenant",
      user_login: "User logged in",
    };
    return actionMap[action] || action.replace(/_/g, " ");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getStatusFromAction = (action: string) => {
    if (action.includes("flagged") || action.includes("anomaly")) return "warning";
    if (action.includes("approved") || action.includes("completed")) return "success";
    return "info";
  };

  const statCardData = getStatCardData(stats);

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Dashboard Content */}
      <main className="p-6 space-y-8">
        {/* Welcome Section */}
        <WelcomeHeader userName={userName} />

        {/* Stats Grid */}
        <div className="grid gap-3 2xl:gap-6 md:grid-cols-3">
          {statCardData.map((card) => (
            <StatCard
              key={card.title} // Use a unique key, like the title
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              trend={card.trend}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {actionCardData.map((card) => (
            <ActionCard
              key={card.title}
              title={card.title}
              description={card.description}
              linkHref={card.linkHref}
              buttonText={card.buttonText}
              icon={card.icon}
            />
          ))}
        </div>

        {/* Recent Activity & Team */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivityCard activities={activities} isLoading={loading} />
          <TeamManagementCard teamMembers={teamMembers} isLoading={loading} />
        </div>
      </main>
    </div>
  );
}
