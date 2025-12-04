import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, profilesApi, setAuthToken, removeAuthToken } from '../lib/api';
import { Profile } from '../types/database';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  profile: Profile | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Check for existing auth token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const { data, error } = await authApi.getMe();
        if (!error && data) {
          setUser(data.user);
          setProfile(data.user);
          setSession({ token });
        } else {
          removeAuthToken();
        }
      }
      setAuthLoading(false);
      setProfileLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => {
    const { data, error } = await authApi.signUp(email, password, userData);

    console.log("signUp", data, error);

    if (!error && data) {
      setAuthToken(data.token);
      setUser(data.user);
      setProfile(data.user);
      setSession({ token: data.token });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authApi.signIn(email, password);

    console.log("signIn", data, error);

    if (!error && data) {
      setAuthToken(data.token);
      setUser(data.user);
      setProfile(data.user);
      setSession({ token: data.token });
    }

    return { error };
  };

  const signOut = async () => {
    removeAuthToken();
    setUser(null);
    setProfile(null);
    setSession(null);
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
