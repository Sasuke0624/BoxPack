import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user]);

  const signUp = async (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log("signUp", data, error);

    if (!error && data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: userData.full_name,
        company_name: userData.company_name || '',
        phone: userData.phone || '',
        points: 0,
        role: 'user',
      });
      console.log("profileError", profileError);
      if (profileError) {
        return { error: profileError };
      }
      setProfile({
        id: data.user.id,
        email,
        full_name: userData.full_name,
        company_name: userData.company_name || '',
        phone: userData.phone || '',
        points: 0,
        role: 'user',
        created_at: '',
        updated_at: '',
      });
    }

    return { error: error };
  };

  const signIn = async (email: string, password: string) => {
    const { data: fetchedData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("signIn", fetchedData, error);
    return { error: error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const loading = authLoading || profileLoading;
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
