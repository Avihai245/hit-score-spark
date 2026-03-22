import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import AudioPlayer from "@/components/AudioPlayer";
import Navbar from "@/components/Navbar";
import GlobalDataStrip from "@/components/GlobalDataStrip";
import Index from "./pages/Index";
import Analyze from "./pages/Analyze";
import Results from "./pages/Results";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Library from "./pages/Library";
import SongDetail from "./pages/SongDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Client Dashboard pages
import DashboardHome from "./pages/dashboard/index";
import DashboardTracks from "./pages/dashboard/Tracks";
import DashboardUploads from "./pages/dashboard/Uploads";
import DashboardInsights from "./pages/dashboard/Insights";
import DashboardCredits from "./pages/dashboard/Credits";
import DashboardBilling from "./pages/dashboard/Billing";
import DashboardNotifications from "./pages/dashboard/Notifications";
import DashboardSupport from "./pages/dashboard/Support";
import DashboardProfile from "./pages/dashboard/Profile";
import DashboardSettings from "./pages/dashboard/Settings";
import DashboardRecommendations from "./pages/dashboard/Recommendations";
import DashboardCompare from "./pages/dashboard/Compare";
import Discover from "./pages/Discover";
import Explore from "./pages/Explore";
import DemoReport from "./pages/DemoReport";

// Admin pages
import { AdminGuard } from "./components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/index";
import AdminUsers from "./pages/admin/users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminAnalytics from "./pages/admin/analytics";
import AdminRevenue from "./pages/admin/revenue";
import AdminContent from "./pages/admin/content";
import AdminTracks from "./pages/admin/tracks";
import AdminMonitoring from "./pages/admin/monitoring";
import AdminSupport from "./pages/admin/support";
import AdminLifecycle from "./pages/admin/lifecycle";
import AdminCoupons from "./pages/admin/coupons";
import AdminPermissions from "./pages/admin/permissions";
import AdminAudit from "./pages/admin/audit";
import AdminSystem from "./pages/admin/system";
import AdminNotifications from "./pages/admin/notifications";
import AdminSunoEngine from "./pages/admin/suno-engine";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  if (isAdminRoute) {
    return (
      <Routes location={location}>
        <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
        <Route path="/admin/users/:userId" element={<AdminGuard><AdminUserDetail /></AdminGuard>} />
        <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics /></AdminGuard>} />
        <Route path="/admin/revenue" element={<AdminGuard><AdminRevenue /></AdminGuard>} />
        <Route path="/admin/content" element={<AdminGuard><AdminContent /></AdminGuard>} />
        <Route path="/admin/tracks" element={<AdminGuard><AdminTracks /></AdminGuard>} />
        <Route path="/admin/monitoring" element={<AdminGuard><AdminMonitoring /></AdminGuard>} />
        <Route path="/admin/support" element={<AdminGuard><AdminSupport /></AdminGuard>} />
        <Route path="/admin/lifecycle" element={<AdminGuard><AdminLifecycle /></AdminGuard>} />
        <Route path="/admin/coupons" element={<AdminGuard><AdminCoupons /></AdminGuard>} />
        <Route path="/admin/permissions" element={<AdminGuard><AdminPermissions /></AdminGuard>} />
        <Route path="/admin/audit" element={<AdminGuard><AdminAudit /></AdminGuard>} />
        <Route path="/admin/system" element={<AdminGuard><AdminSystem /></AdminGuard>} />
        <Route path="/admin/suno-engine" element={<AdminGuard><AdminSunoEngine /></AdminGuard>} />
        <Route path="/admin/notifications" element={<AdminGuard><AdminNotifications /></AdminGuard>} />
      </Routes>
    );
  }

  if (isDashboardRoute) {
    return (
      <Routes location={location}>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="/dashboard/tracks" element={<ProtectedRoute><DashboardTracks /></ProtectedRoute>} />
        <Route path="/dashboard/uploads" element={<ProtectedRoute><DashboardUploads /></ProtectedRoute>} />
        <Route path="/dashboard/insights" element={<ProtectedRoute><DashboardInsights /></ProtectedRoute>} />
        <Route path="/dashboard/credits" element={<ProtectedRoute><DashboardCredits /></ProtectedRoute>} />
        <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardBilling /></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute><DashboardNotifications /></ProtectedRoute>} />
        <Route path="/dashboard/support" element={<ProtectedRoute><DashboardSupport /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><DashboardProfile /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
        <Route path="/dashboard/recommendations" element={<ProtectedRoute><DashboardRecommendations /></ProtectedRoute>} />
        <Route path="/dashboard/compare" element={<ProtectedRoute><DashboardCompare /></ProtectedRoute>} />
        <Route path="/dashboard/search" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/demo-report" element={<DemoReport />} />
          <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/me" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
          <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
          <Route path="/auth" element={<Navigate to="/analyze" replace />} />
          <Route path="/search" element={<Navigate to="/dashboard" replace />} />
          <Route path="/song/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  return (
    <>
      {!isAdminRoute && !isDashboardRoute && <GlobalDataStrip />}
      {!isAdminRoute && !isDashboardRoute && <Navbar />}
      <AnimatedRoutes />
      {!isAdminRoute && <AudioPlayer />}
    </>
  );
};

const App = () => (
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
);

export default App;
