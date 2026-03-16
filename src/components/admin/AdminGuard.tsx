import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Check is_admin field — may not be in ViralizeProfile type yet, so cast
      const isAdmin = (profile as any)?.is_admin === true;
      if (!profile || !isAdmin) {
        toast.error('Access denied', { description: 'Admin privileges required.' });
        navigate('/');
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = (profile as any)?.is_admin === true;
  if (!isAdmin) return null;

  return <>{children}</>;
};
