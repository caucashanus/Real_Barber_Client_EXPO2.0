import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { LOGIN_PATH } from '@/constants/authRoutes';
import { getClientReferralSlug, referralDashboardHref } from '@/utils/referralDashboardHelpers';

/** Legacy route — přesměrování na /u/{slug}/doporuceni. */
export default function ReferralLegacyRedirect() {
  const { apiToken, client } = useAuth();

  if (!apiToken || !client?.id) {
    return <Redirect href={LOGIN_PATH} />;
  }

  return <Redirect href={referralDashboardHref(getClientReferralSlug(client.id))} />;
}
