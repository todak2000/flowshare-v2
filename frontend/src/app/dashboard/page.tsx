"use client";
import { useEffect } from "react";
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
import { useDashboardStore } from "@/store/dashboard-store";

/**
 * The main dashboard page, composed of the reusable components defined above.
 * Now uses Zustand store to cache dashboard data and avoid frequent API calls.
 */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, activities, teamMembers, isLoading, fetchDashboardData } = useDashboardStore();

  // Centralize the name logic
  const userName = user?.full_name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    if (user) {
      // fetchDashboardData will check cache validity and only fetch if needed
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

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
          <RecentActivityCard activities={activities} isLoading={isLoading} />
          <TeamManagementCard teamMembers={teamMembers} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
