import { Stack } from 'expo-router';

import { useTranslation } from '@/app/hooks/useTranslation';

export default function RBCLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" options={{ title: t('rbcCardTitle') }} />
      <Stack.Screen name="historie" options={{ title: t('rbcTransactionHistory') }} />
      <Stack.Screen name="design/index" options={{ title: t('rbcCardDesigns') }} />
      <Stack.Screen name="design/[designId]" options={{ title: t('rbcCardDesign') }} />
    </Stack>
  );
}
