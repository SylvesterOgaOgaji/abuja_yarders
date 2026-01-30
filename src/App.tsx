import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
// import AppPlugin and others removed
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UpdatePassword from "./pages/UpdatePassword";
import SellerProfile from "./pages/SellerProfile";
import DashboardCMS from "./pages/admin/DashboardCMS";
import PledgeTracking from "@/pages/admin/PledgeTracking";
import AdminReports from "@/pages/admin/AdminReports";
import CommitmentAnalysis from "./pages/admin/CommitmentAnalysis";
import Commitments from "./pages/Commitments";
import Profile from "./pages/Profile";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
// Removed usePushNotifications
import AdminUserManagement from "@/pages/admin/AdminUserManagement";
import AdminBanRequests from "@/pages/admin/AdminBanRequests";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import ReactivateAccount from "./pages/auth/ReactivateAccount";
import ShareStory from "./pages/ShareStory";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const AppRoutes = () => {
  useProfileCompletion(); // Enforce profile completion

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reactivate" element={<ReactivateAccount />} />
      <Route path="/auth/update-password" element={<UpdatePassword />} />
      <Route path="/seller/:userId" element={<SellerProfile />} />
      <Route path="/admin/cms" element={<DashboardCMS />} />
      <Route path="/admin/pledges" element={<PledgeTracking />} />
      <Route path="/admin/commitments" element={<CommitmentAnalysis />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/admin/users" element={<AdminUserManagement />} />
      <Route path="/admin/ban-requests" element={<AdminBanRequests />} />
      <Route path="/commitments" element={<Commitments />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/legal/:type" element={<LegalPage />} />
      <Route path="/share-story" element={<ShareStory />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // Listen for auth state changes to show welcome toast
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const hash = window.location.hash;
        if (hash && (hash.includes('type=signup') || hash.includes('type=invite'))) {
          toast.success("Successfully verified! Welcome to Abuja Yarders.");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
