import { Redirect, usePathname } from 'expo-router';
import React from 'react';
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
import OperatorFloatingButton from '@/components/OperatorFloatingButton';
import SiteLoadingState from '@/components/SiteLoadingState';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { apiToken, client, isLoading } = useAuth();
  const pathname = usePathname();

  if (!isLoading && !apiToken && !isPublicRoute(pathname)) {
    return <Redirect href={LOGIN_PATH} />;
  }

  if (
    !isLoading &&
    apiToken &&
    client &&
    isClientMissingRequiredEmail(client) &&
    !isLoginCompleteEmailRoute(pathname)
  ) {
    return <Redirect href={LOGIN_COMPLETE_EMAIL_PATH} />;
  }

  if (!isLoading && apiToken && isAuthFlowRoute(pathname)) {
    return <Redirect href="/real-barber" />;
  }

  return (
    <View className="flex-1">
      {children}
      {isLoading ? (
        <View className="absolute inset-0 z-50 bg-light-primary dark:bg-dark-primary">
          <SiteLoadingState layout="page" />
        </View>
      ) : null}
      {!isLoading && apiToken ? <OperatorFloatingButton /> : null}
    </View>
  );
}
