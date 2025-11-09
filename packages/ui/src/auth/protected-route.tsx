'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';

export interface ProtectedRouteProps {
  auth: import('firebase/auth').Auth;
  fallback?: React.ReactNode;
  children: (user: User) => React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  auth,
  fallback = null,
  children
}) => {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace('/auth/sign-in');
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, [auth, router]);

  if (loading) {
    return fallback;
  }

  if (!user) {
    return fallback;
  }

  return <>{children(user)}</>;
};
