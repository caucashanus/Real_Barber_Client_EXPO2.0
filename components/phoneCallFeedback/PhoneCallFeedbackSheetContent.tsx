import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';
import StarRatingPicker from '@/components/phoneCallFeedback/StarRatingPicker';
import SlotTimePill from '@/components/SlotTimePill';
import ThemedText from '@/components/ThemedText';
import {
  PHONE_CALL_FEEDBACK_REASON_KEYS,
  PHONE_CALL_FEEDBACK_REASON_LABEL_KEYS,
  type PhoneCallFeedbackReasonKey,
} from '@/constants/phoneCallFeedbackReasons';
import type { TranslationKey } from '@/locales';

interface PhoneCallFeedbackSheetContentProps {
  t: (key: TranslationKey) => string;
  rating: number;
  reasons: Set<PhoneCallFeedbackReasonKey>;
  onRatingChange: (rating: number) => void;
  onToggleReason: (key: PhoneCallFeedbackReasonKey) => void;
  onSubmitLowRating: () => void;
}

export default function PhoneCallFeedbackSheetContent({
  t,
  rating,
  reasons,
  onRatingChange,
  onToggleReason,
  onSubmitLowRating,
}: PhoneCallFeedbackSheetContentProps) {
  const showReasons = rating >= 1 && rating <= 4;

  const reasonChips = useMemo(
    () =>
      PHONE_CALL_FEEDBACK_REASON_KEYS.map((key) => (
        <SlotTimePill
          key={key}
          title={t(PHONE_CALL_FEEDBACK_REASON_LABEL_KEYS[key])}
          selected={reasons.has(key)}
          onPress={() => onToggleReason(key)}
          spaced
        />
      )),
    [onToggleReason, reasons, t]
  );

  return (
    <View className="px-4 pb-8 pt-2">
      <ThemedText className="mb-1 text-center text-base font-semibold leading-6">
        {t('phoneCallFeedbackTitle')}
      </ThemedText>

      <StarRatingPicker rating={rating} onChange={onRatingChange} />

      {showReasons ? (
        <View className="mt-2">
          <ThemedText className="mb-3 text-center text-sm text-light-subtext dark:text-dark-subtext">
            {t('phoneCallFeedbackReasonsSubtitle')}
          </ThemedText>
          <View className="flex-row flex-wrap items-start">{reasonChips}</View>
          <View className="mt-5">
            <AppButton title={t('phoneCallFeedbackSubmit')} fullWidth onPress={onSubmitLowRating} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
