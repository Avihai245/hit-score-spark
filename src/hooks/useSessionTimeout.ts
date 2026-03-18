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
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours absolute
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

export const useSessionTimeout = () => {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up timeout if user is logged in
    if (!session) return;

    let idleTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let absoluteTimer: NodeJS.Timeout;

    // Reset idle timeout on user activity
    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);

      // Show warning before timeout
      warningTimer = setTimeout(() => {
        toast.warning('Your session will expire in 2 minutes', {
          description: 'Click anywhere to stay logged in',
          action: {
            label: 'Stay logged in',
            onClick: resetIdleTimer,
          },
          duration: 6000,
        });
      }, IDLE_TIMEOUT - WARNING_TIME);

      // Perform logout after idle timeout
      idleTimer = setTimeout(() => {
        toast.info('Session expired due to inactivity', {
          description: 'Please log in again',
        });
        signOut();
        navigate('/', { replace: true });
      }, IDLE_TIMEOUT);
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
  }, [session, signOut, navigate]);
};

export default useSessionTimeout;
