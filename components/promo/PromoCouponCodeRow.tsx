import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import { useCopyFeedback } from '@/contexts/CopyFeedbackContext';
import type { TranslationKey } from '@/locales';

interface PromoCouponCodeRowProps {
  code: string;
  t: (key: TranslationKey) => string;
}

export default function PromoCouponCodeRow({ code, t }: PromoCouponCodeRowProps) {
  const { copyToClipboard } = useCopyFeedback();

  const handleCopy = () => {
    copyToClipboard(code);
  };

  return (
    <View className="flex-row flex-wrap items-center justify-start">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${code}. ${t('homeCouponCopyCode')}`}
        onPress={handleCopy}
        className="mr-2 flex-row items-center gap-1.5 active:opacity-70">
        <ThemedText className="font-mono text-2xl font-bold tracking-wide">{code}</ThemedText>
        <Icon name="Copy" size={18} className="text-light-subtext dark:text-dark-subtext" />
      </Pressable>
      <SlotTimePill title={t('homeCouponCopyCode')} onPress={handleCopy} />
    </View>
  );
}
