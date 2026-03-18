import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AudioPlayer from "@/components/AudioPlayer";
import Navbar from "@/components/Navbar";
import GlobalDataStrip from "@/components/GlobalDataStrip";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// ─── Lazy-loaded pages (code splitting) ─────────────────────────────────────
const Index = lazy(() => import("./pages/Index"));
const Analyze = lazy(() => import("./pages/Analyze"));
const Results = lazy(() => import("./pages/Results"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Library = lazy(() => import("./pages/Library"));
const SongDetail = lazy(() => import("./pages/SongDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Client Dashboard pages
const DashboardHome = lazy(() => import("./pages/dashboard/index"));
const DashboardTracks = lazy(() => import("./pages/dashboard/Tracks"));
const DashboardUploads = lazy(() => import("./pages/dashboard/Uploads"));
const DashboardInsights = lazy(() => import("./pages/dashboard/Insights"));
const DashboardCredits = lazy(() => import("./pages/dashboard/Credits"));
const DashboardBilling = lazy(() => import("./pages/dashboard/Billing"));
const DashboardNotifications = lazy(() => import("./pages/dashboard/Notifications"));
const DashboardSupport = lazy(() => import("./pages/dashboard/Support"));
const DashboardProfile = lazy(() => import("./pages/dashboard/Profile"));
const DashboardSettings = lazy(() => import("./pages/dashboard/Settings"));
const DashboardRecommendations = lazy(() => import("./pages/dashboard/Recommendations"));
const DashboardCompare = lazy(() => import("./pages/dashboard/Compare"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/index"));
const AdminUsers = lazy(() => import("./pages/admin/users"));
const AdminAnalytics = lazy(() => import("./pages/admin/analytics"));
const AdminRevenue = lazy(() => import("./pages/admin/revenue"));
const AdminContent = lazy(() => import("./pages/admin/content"));
const AdminTracks = lazy(() => import("./pages/admin/tracks"));
const AdminMonitoring = lazy(() => import("./pages/admin/monitoring"));
const AdminSupport = lazy(() => import("./pages/admin/support"));
const AdminLifecycle = lazy(() => import("./pages/admin/lifecycle"));
const AdminCoupons = lazy(() => import("./pages/admin/coupons"));
const AdminPermissions = lazy(() => import("./pages/admin/permissions"));
const AdminAudit = lazy(() => import("./pages/admin/audit"));
const AdminSystem = lazy(() => import("./pages/admin/system"));
const AdminNotifications = lazy(() => import("./pages/admin/notifications"));

// ─── React Query configuration ──────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000,         // Garbage collect after 10 minutes
      retry: 2,                        // Retry failed requests twice
      refetchOnWindowFocus: false,     // Don't refetch on every tab switch
    },
  },
});

// ─── Loading spinner for lazy routes ────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
  </div>
);

// ─── Page transition variants ───────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ─── Routes ─────────────────────────────────────────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/tracks" element={<AdminTracks />} />
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/lifecycle" element={<AdminLifecycle />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/permissions" element={<AdminPermissions />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/system" element={<AdminSystem />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Routes>
      </Suspense>
    );
  }

  if (isDashboardRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/tracks" element={<DashboardTracks />} />
          <Route path="/dashboard/uploads" element={<DashboardUploads />} />
          <Route path="/dashboard/insights" element={<DashboardInsights />} />
          <Route path="/dashboard/credits" element={<DashboardCredits />} />
          <Route path="/dashboard/billing" element={<DashboardBilling />} />
          <Route path="/dashboard/notifications" element={<DashboardNotifications />} />
          <Route path="/dashboard/support" element={<DashboardSupport />} />
          <Route path="/dashboard/profile" element={<DashboardProfile />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />
          <Route path="/dashboard/recommendations" element={<DashboardRecommendations />} />
          <Route path="/dashboard/compare" element={<DashboardCompare />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/library" element={<Library />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
};

// ─── App content with session timeout ───────────────────────────────────────
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Session timeout — auto-logout on inactivity
  useSessionTimeout();

  return (
    <>
      {!isAdminRoute && !isDashboardRoute && <GlobalDataStrip />}
      {!isAdminRoute && !isDashboardRoute && <Navbar />}
      <AnimatedRoutes />
      {!isAdminRoute && <AudioPlayer />}
    </>
  );
};

// ─── Root App ───────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AudioPlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
