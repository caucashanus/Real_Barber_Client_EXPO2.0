import React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BarberBookFooterProps {
  employeeId: string;
  bottomInset: number;
  t: (key: TranslationKey) => string;
}

export default function BarberBookFooter({ employeeId, bottomInset, t }: BarberBookFooterProps) {
  return (
    <View
      style={{ paddingBottom: bottomInset }}
      className="flex-row items-center justify-start border-t border-neutral-200 bg-light-primary px-global pt-4 dark:border-dark-secondary dark:bg-dark-primary">
      <View>
        <ThemedText className="text-xl font-bold">{t('barberBook')}</ThemedText>
        <ThemedText className="text-xs opacity-60">{t('barberReserveWith')}</ThemedText>
      </View>
      <View className="ml-auto flex-row items-center">
        <Button
          title={t('commonReserve')}
          variant="primary"
          className="ml-6 px-6"
          size="medium"
          rounded="lg"
          href={`/screens/reservation-create?employeeId=${encodeURIComponent(employeeId)}`}
        />
      </View>
    </View>
  );
}
