import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { LOGIN_PATH } from '@/constants/authRoutes';

export default function Index() {
  const { apiToken, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return apiToken ? <Redirect href="/real-barber" /> : <Redirect href={LOGIN_PATH} />;
}
