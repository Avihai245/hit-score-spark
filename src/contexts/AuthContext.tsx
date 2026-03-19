import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Plan } from '@/lib/supabase';

export interface ViralizeProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan: Plan;
  analyses_used: number;
  remixes_used: number;
  remixes_this_month: number;
  analyses_this_month: number;
  credits: number;
  api_key: string | null;
  created_at: string;
  is_admin: boolean | null;
  // Stripe billing fields
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  plan_expires_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ViralizeProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ViralizeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (u: User): Promise<ViralizeProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('viralize_users')
        .select('*')
        .eq('id', u.id)
        .single();

      // Graceful fallback for RLS infinite recursion
      if (error?.message?.includes('infinite recursion')) {
        console.warn('RLS recursion detected — using auth.user() fallback');
        return {
          id: u.id,
          email: u.email || '',
          display_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || null,
          plan: 'free' as Plan,
          analyses_used: 0,
          remixes_used: 0,
          remixes_this_month: 0,
          analyses_this_month: 0,
          credits: 0,
          api_key: null,
          created_at: new Date().toISOString(),
          is_admin: false,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          subscription_status: null,
          plan_expires_at: null,
        } as ViralizeProfile;
      }

      // PGRST116 = no rows found
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create it
        const displayName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split('@')[0] ||
          null;

        // Check if admin email — give full access
        const isAdmin = u.email === 'or3004@gmail.com' || u.email === 'office@sabatiers.com';

        const { data: newProfile, error: createError } = await supabase
          .from('viralize_users')
          .insert({
            id: u.id,
            email: u.email,
            display_name: displayName,
            plan: isAdmin ? 'studio' : 'free',
            is_admin: isAdmin,
            analyses_used: 0,
            remixes_used: 0,
            analyses_this_month: 0,
            credits: isAdmin ? 99999 : 100,
            subscription_status: isAdmin ? 'active' : null,
            api_key: null,
          })
          .select('*')
          .single();

        if (createError) {
          console.warn('Profile create error:', createError.message);
          return null;
        }
        return newProfile as ViralizeProfile;
      }

      if (error) {
        console.warn('Profile fetch error:', error.message);
        return null;
      }

      return data as ViralizeProfile;
    } catch (err) {
      console.warn('fetchOrCreateProfile threw:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchOrCreateProfile(user);
      setProfile(p);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOrCreateProfile(s.user)
          .then(setProfile)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOrCreateProfile(s.user).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/library' },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
