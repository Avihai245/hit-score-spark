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
    if (loading) return;
    if (!profile || !profile.is_admin) {
      toast.error('Access denied');
      navigate('/', { replace: true });
    }
  }, [profile, loading, navigate]);

  if (loading) return null;
  if (!profile?.is_admin) return null;
  return <>{children}</>;
};
