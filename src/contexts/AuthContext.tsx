import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  aadhaar: string;
  address: string;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        return null;
      }

      return {
        id: data.id,
        full_name: data.full_name || '',
        mobile: data.mobile || '',
        aadhaar: data.aadhaar || '',
        address: data.address || '',
        created_at: data.updated_at || new Date().toISOString()
      } as Profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError('Failed to fetch profile');
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const profile = await fetchProfile(user.id);
      if (profile) {
        setProfile(profile);
        setError(null);
      }
    } catch (err) {
      console.error('Error in refreshProfile:', err);
      setError('Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        setLoading(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setError(sessionError.message);
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          console.log('Session retrieved:', session ? 'exists' : 'none');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('Fetching profile for user:', session.user.id);
            const profile = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profile);
              console.log('Profile fetched:', profile ? 'exists' : 'none');
            }
          }
          
          setError(null);
          setLoading(false);
          setInitialized(true);
        }
      } catch (err) {
        console.error('Error in initializeAuth:', err);
        if (mounted) {
          setError('Failed to initialize auth');
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) setProfile(profile);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setProfile(null);
      setError(null);
      
      // Force reload the page to clear any cached state
      window.location.href = '/auth';
    } catch (err: Error | unknown) {
      console.error('Error in signOut:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Don't render children until auth is initialized
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const value = {
    session,
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
