"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuthStore, UserProfile } from "@/store/auth-store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LogoutDialog } from "@/components/layout/LogoutDialog";
import { LayoutSkeleton } from "@/components/layout/LayoutSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, clearUser, getUserRole } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userRole = getUserRole();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await apiClient.get("/api/auth/me");
        setUser(userData as UserProfile);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [user, setUser, router]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      // Clear all session and local storage data
      sessionStorage.removeItem('flowshare-user-token');
      sessionStorage.removeItem('flowshare-user-token-expires-at');
      localStorage.removeItem('flowshare-auth-storage');

      // Clear auth cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // Clear user state
      clearUser();

      // Sign out from Firebase
      await signOut(auth);

      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return <LayoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        role={userRole as "field_operator" | "coordinator" | "partner"}
      />

      <div className="lg:pl-72">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setLogoutModalOpen={setLogoutModalOpen}
        />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <LogoutDialog
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        onConfirm={handleLogout}
        loggingOut={loggingOut}
      />
    </div>
  );
}
