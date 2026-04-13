import { Stack } from 'expo-router';
import React from 'react';
import { Dimensions, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

const windowWidth = Dimensions.get('window').width;
export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen />
      <Header title=" " showBackButton />
      <View className="flex-1 items-center justify-center bg-light-primary p-global dark:bg-dark-primary">
        <View className=" mb-8">
          <Icon name="AlertCircle" strokeWidth={1} size={70} />
        </View>
        <ThemedText className="mb-2 text-2xl font-bold">Page Not Found</ThemedText>
        <ThemedText className="mb-8 w-2/3 text-center text-base text-light-subtext dark:text-dark-subtext">
          The page you're looking for doesn't exist or has been moved.
        </ThemedText>
        <View className="flex-row items-center justify-center">
          <Button title={t('notFoundBackToHome')} href="/" size="medium" className="px-6" />
        </View>
      </View>
    </>
  );
}
