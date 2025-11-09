'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export interface WithRoleOptions {
  allowed: string[];
  redirect?: string;
}

export function withRole<P extends { userRole?: string }>(
  Component: React.ComponentType<P>,
  options: WithRoleOptions
) {
  const Guard: React.FC<P> = (props) => {
    const router = useRouter();
    const role = props.userRole;

    React.useEffect(() => {
      if (!role) {
        router.replace(options.redirect ?? '/');
        return;
      }
      if (!options.allowed.includes(role)) {
        router.replace(options.redirect ?? '/');
      }
    }, [role, router]);

    if (!role || !options.allowed.includes(role)) {
      return null;
    }

    return <Component {...props} />;
  };

  return Guard;
}
