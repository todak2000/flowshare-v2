import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function useAuthActions() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      // Clear all session and local storage data for complete logout
      // This prevents potential security issues from lingering auth data
      sessionStorage.removeItem('flowshare-user-token');
      sessionStorage.removeItem('flowshare-user-token-expires-at');
      sessionStorage.removeItem('newRegistration');
      sessionStorage.removeItem('invitationAccepted');
      sessionStorage.removeItem('invitationId');
      sessionStorage.removeItem('invitationEmail');
      sessionStorage.removeItem('invitationRole');
      sessionStorage.removeItem('invitationTenantId');
      sessionStorage.removeItem('invitationPartnerName');
      sessionStorage.removeItem('paymentCompleted');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentData');

      // Clear auth store from localStorage
      localStorage.removeItem('flowshare-auth-storage');

      // Clear auth cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // Sign out from Firebase
      await signOut(auth);

      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return { loggingOut, handleLogout };
}