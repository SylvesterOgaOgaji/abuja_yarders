import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { initializeRevenueCat } from "@/services/inAppPurchase";
import { App as AppPlugin } from "@capacitor/app"; // Import App plugin
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SellerProfile from "./pages/SellerProfile";
import DashboardCMS from "./pages/admin/DashboardCMS";
import PledgeTracking from "@/pages/admin/PledgeTracking";
import AdminReports from "@/pages/admin/AdminReports";
import CommitmentAnalysis from "./pages/admin/CommitmentAnalysis";
import Commitments from "./pages/Commitments";
import Profile from "./pages/Profile";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import { usePushNotifications } from "@/hooks/usePushNotifications"; // Import Push Hook
import AdminUserManagement from "@/pages/admin/AdminUserManagement";

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

const App = () => {
  usePushNotifications(); // Initialize push notifications

  useEffect(() => {
    // Initialize RevenueCat only on native platforms
    if (Capacitor.isNativePlatform()) {
      initializeRevenueCat();
    }

    // Listen for app state changes for background refresh
    AppPlugin.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        queryClient.invalidateQueries(); // Refresh data when app comes to foreground
      }
    });

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/seller/:userId" element={<SellerProfile />} />
            <Route path="/admin/cms" element={<DashboardCMS />} />
            <Route path="/admin/pledges" element={<PledgeTracking />} />
            <Route path="/admin/commitments" element={<CommitmentAnalysis />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/commitments" element={<Commitments />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/legal/:type" element={<LegalPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
