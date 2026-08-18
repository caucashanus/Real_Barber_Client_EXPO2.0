import React from 'react';
import { View } from 'react-native';

import BranchAddress from '@/components/shared/BranchAddress';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  branchName: string;
  branchAddress?: string | null;
  topClassName?: string;
  valueClassName?: string;
}

/** Web parity: Pobočka + volitelně Adresa (muted + copy). */
export default function BookingSummaryBranchSection({
  branchName,
  branchAddress,
  topClassName,
  valueClassName = 'mt-1 text-sm font-semibold',
}: Props) {
  const { t } = useTranslation();
  const address = branchAddress?.trim();

  return (
    <>
      <View className={topClassName}>
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
          {t('reservationSummaryBranch')}
        </ThemedText>
        <ThemedText className={valueClassName}>{branchName}</ThemedText>
      </View>
      {address ? (
        <View className="mt-4">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('bookingSummaryAddress')}
          </ThemedText>
          <BranchAddress address={address} className="mt-1" />
        </View>
      ) : null}
    </>
  );
}
