import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/app/contexts/AuthContext';

export default function Index() {
  const { apiToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" color="#737373" />
      </View>
    );
  }

  return apiToken ? <Redirect href="/real-barber" /> : <Redirect href="/screens/welcome" />;
}
