import { Redirect, usePathname } from 'expo-router';
import React from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { isAuthFlowRoute, isPublicRoute, LOGIN_PATH } from '@/constants/authRoutes';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { apiToken, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return null;
  }

  if (!apiToken && !isPublicRoute(pathname)) {
    return <Redirect href={LOGIN_PATH} />;
  }

  if (apiToken && isAuthFlowRoute(pathname)) {
    return <Redirect href="/real-barber" />;
  }

  return <>{children}</>;
}
