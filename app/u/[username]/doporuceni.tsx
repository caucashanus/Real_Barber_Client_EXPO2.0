import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

export const options = {
  headerShown: false,
  title: '',
};

import { useAuth } from '@/contexts/AuthContext';
import ReferralDashboardScreen from '@/components/referral/ReferralDashboardScreen';
import { getClientReferralSlug, referralDashboardHref } from '@/utils/referralDashboardHelpers';

export default function ReferralDashboardRoute() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { apiToken, client } = useAuth();
  const routeSlug = typeof username === 'string' ? username : '';
  const ownSlug = client?.id ? getClientReferralSlug(client.id) : '';

  if (apiToken && ownSlug && routeSlug && routeSlug !== ownSlug) {
    return <Redirect href={referralDashboardHref(ownSlug)} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: '' }} />
      <ReferralDashboardScreen />
    </>
  );
}
