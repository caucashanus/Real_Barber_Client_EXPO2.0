import React, { useEffect, useState } from 'react';
import { Alert, AppState, Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import AppButton from '@/components/AppButton';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { getBranchOpenStatus, type BranchOpenStatusKind } from '@/utils/branchOpenStatus';

interface BranchOpenStatusRowProps {
  t: (key: TranslationKey) => string;
}

const STATUS_CHIP_CLASS = 'h-7 rounded-md px-2 py-0.5';

function statusLabel(kind: BranchOpenStatusKind, t: (key: TranslationKey) => string): string {
  switch (kind) {
    case 'open':
      return t('nearestBranchStatusOpen');
    case 'closed':
      return t('nearestBranchStatusClosed');
    case 'openingSoon':
      return t('nearestBranchStatusOpeningSoon');
    case 'closingSoon':
      return t('nearestBranchStatusClosingSoon');
  }
}

function statusChipStyle(kind: BranchOpenStatusKind): {
  containerStyle: ViewStyle;
  textColor: string;
  dotColor: string;
} {
  if (kind === 'closed') {
    return {
      containerStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        borderColor: 'rgba(220, 38, 38, 0.4)',
      },
      textColor: '#DC2626',
      dotColor: '#DC2626',
    };
  }
  if (kind === 'openingSoon' || kind === 'closingSoon') {
    return {
      containerStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        borderColor: 'rgba(251, 146, 60, 0.55)',
      },
      textColor: '#fb923c',
      dotColor: '#fb923c',
    };
  }
  return {
    containerStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      borderColor: 'rgba(34, 197, 94, 0.55)',
    },
    textColor: '#4ade80',
    dotColor: '#4ade80',
  };
}

export default function BranchOpenStatusRow({ t }: BranchOpenStatusRowProps) {
  const [kind, setKind] = useState<BranchOpenStatusKind>(() => getBranchOpenStatus());

  useEffect(() => {
    const tick = () => setKind(getBranchOpenStatus());
    tick();
    const intervalId = setInterval(tick, 60_000);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
    };
  }, []);

  const showHours = () => {
    Alert.alert(
      t('nearestBranchHoursTooltipTitle'),
      `${t('nearestBranchHoursWeekdays')}\n${t('nearestBranchHoursWeekend')}`
    );
  };

  const label = statusLabel(kind, t);
  const chip = statusChipStyle(kind);

  return (
    <View className="w-full flex-row flex-wrap items-center gap-3">
      <AppButton
        variant="choice"
        size="xs"
        disableHaptic
        className={STATUS_CHIP_CLASS}
        style={chip.containerStyle}>
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: chip.dotColor,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              lineHeight: 16,
              color: chip.textColor,
              ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
            }}
            numberOfLines={1}>
            {label}
          </Text>
        </View>
      </AppButton>
      <Pressable onPress={showHours} hitSlop={8} className="active:opacity-75">
        <ThemedText className="text-sm leading-5 text-light-subtext underline dark:text-dark-subtext">
          {t('nearestBranchHoursHint')}
        </ThemedText>
      </Pressable>
    </View>
  );
}
