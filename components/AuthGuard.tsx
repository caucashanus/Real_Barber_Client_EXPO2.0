import { Redirect, usePathname } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/app/contexts/AuthContext';
import { isAuthFlowRoute, isPublicRoute, LOGIN_PATH } from '@/constants/authRoutes';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { apiToken, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" color="#737373" />
      </View>
    );
  }

  if (!apiToken && !isPublicRoute(pathname)) {
    return <Redirect href={LOGIN_PATH} />;
  }

  if (apiToken && isAuthFlowRoute(pathname)) {
    return <Redirect href="/real-barber" />;
  }

  return <>{children}</>;
}
