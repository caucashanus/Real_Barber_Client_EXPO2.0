import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/app/contexts/AuthContext';
import useThemeColors from '@/app/contexts/ThemeColors';

export default function Index() {
  const colors = useThemeColors();
  const { apiToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return apiToken ? <Redirect href="/(tabs)/(home)" /> : <Redirect href="/screens/welcome" />;
}
