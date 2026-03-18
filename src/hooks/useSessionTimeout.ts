/**
 * Session Timeout Hook
 * Automatically logs out users after period of inactivity
 * or absolute timeout for security
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Configuration
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity (admin)
const IDLE_TIMEOUT_USER = 15 * 60 * 1000; // 15 minutes for regular users
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours absolute
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

export const useSessionTimeout = () => {
  const { signOut, session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up timeout if user is logged in
    if (!session) return;

    // Admins have 30 minute timeout, users have 15 minute
    const timeoutDuration = profile?.is_admin ? IDLE_TIMEOUT : IDLE_TIMEOUT_USER;
    const warningDuration = timeoutDuration - WARNING_TIME;

    let idleTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let absoluteTimer: NodeJS.Timeout;

    // Reset idle timeout on user activity
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);

      // Show warning before timeout
      warningTimer = setTimeout(() => {
        const minutes = Math.round(WARNING_TIME / 60000);
        toast.warning(`Session expires in ${minutes} minutes`, {
          description: 'Click anywhere to stay logged in',
          action: {
            label: 'Stay logged in',
            onClick: resetIdleTimer,
          },
          duration: 6000,
        });
      }, warningDuration);

      // Perform logout after idle timeout
      idleTimer = setTimeout(() => {
        toast.info('Session expired due to inactivity', {
          description: 'Please log in again',
        });
        signOut();
        navigate('/', { replace: true });
      }, timeoutDuration);
    };

    // Set absolute timeout (regardless of activity)
    absoluteTimer = setTimeout(() => {
      toast.info('Session expired for security', {
        description: 'Please log in again',
      });
      signOut();
      navigate('/', { replace: true });
    }, ABSOLUTE_TIMEOUT);

    // Activity events that reset the idle timer
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Attach event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Initialize timers
    resetIdleTimer();

    // Cleanup on unmount
    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      clearTimeout(absoluteTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [session, profile?.is_admin, signOut, navigate]);
};

export default useSessionTimeout;
