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

// Admin pages
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
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
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
      </Routes>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
          <Route path="/results" element={<Results />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/library" element={<Library />} />
          <Route path="/song/:id" element={<ProtectedRoute><SongDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<Settings />} />
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
