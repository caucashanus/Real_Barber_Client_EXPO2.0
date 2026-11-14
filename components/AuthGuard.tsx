import { Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import {
  isAuthFlowRoute,
  isLoginCompleteEmailRoute,
  isPublicRoute,
  LOGIN_COMPLETE_EMAIL_PATH,
  LOGIN_PATH,
} from '@/constants/authRoutes';
import { isClientMissingRequiredEmail } from '@/utils/signupHelpers';
import AppColdStartSplash from '@/components/AppColdStartSplash';
import OperatorFloatingButton from '@/components/OperatorFloatingButton';
import { useAppBootstrapGate } from '@/hooks/useAppBootstrapGate';
import { useColdStartHomePrefetchGate } from '@/hooks/useColdStartHomePrefetchGate';
import { useNetworkConnectivity } from '@/hooks/useNetworkConnectivity';

const ROOT_SHELL_CLASS = 'flex-1 bg-light-primary dark:bg-dark-primary';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { apiToken, client, isLoading } = useAuth();
  const pathname = usePathname();
  const showAuthBootstrap = useAppBootstrapGate(isLoading);
  const homePrefetchReady = useColdStartHomePrefetchGate(apiToken);
  const showColdStart = showAuthBootstrap || !homePrefetchReady;
  const { offline: networkOffline } = useNetworkConnectivity();

  useEffect(() => {
    if (!showColdStart) return;
    void SplashScreen.hideAsync();
  }, [showColdStart]);

  if (showColdStart) {
    return (
      <View className={ROOT_SHELL_CLASS}>
        <AppColdStartSplash />
      </View>
    );
  }

  if (!apiToken && !isPublicRoute(pathname)) {
    return <Redirect href={LOGIN_PATH} />;
  }

  if (
    apiToken &&
    client &&
    isClientMissingRequiredEmail(client) &&
    !isLoginCompleteEmailRoute(pathname)
  ) {
    return <Redirect href={LOGIN_COMPLETE_EMAIL_PATH} />;
  }

  if (apiToken && isAuthFlowRoute(pathname)) {
    return <Redirect href="/real-barber" />;
  }

  return (
    <View className={ROOT_SHELL_CLASS}>
      {children}
      {apiToken && !networkOffline ? <OperatorFloatingButton /> : null}
    </View>
  );
}