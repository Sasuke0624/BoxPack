import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useProtectedRoute(onUnauthenticated: () => void, requiredRole?: 'admin' | 'user') {
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      onUnauthenticated();
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      onUnauthenticated();
    }
  }, [user, profile, loading, requiredRole, onUnauthenticated]);

  return { user, loading, profile };
}
