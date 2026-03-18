import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!profile?.is_admin) {
      toast.error('Access denied. Admin privileges required.', {
        description: 'You do not have permission to access this page.',
      });
      navigate('/', { replace: true });
    }
  }, [profile?.is_admin, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-sm text-white/60">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if not admin
  if (!profile?.is_admin) {
    return null;
  }

  return <>{children}</>;
};
