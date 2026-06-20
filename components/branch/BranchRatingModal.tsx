import React from 'react';
import { Modal, Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import RatingBreakdownPanel from '@/components/detail/RatingBreakdownPanel';
import type { TranslationKey } from '@/locales';

interface BranchRatingModalProps {
  visible: boolean;
  countByRating: Record<number, number>;
  average: number;
  displayTotal: number;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchRatingModal({
  visible,
  countByRating,
  average,
  displayTotal,
  onClose,
  t,
}: BranchRatingModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-light-primary p-global pb-8 dark:bg-dark-primary"
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <ThemedText className="text-lg font-semibold">{t('branchFullRating')}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12} className="p-2">
              <Icon name="X" size={24} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>
          <RatingBreakdownPanel
            countByRating={countByRating}
            average={average}
            displayTotal={displayTotal}
            reviewsLabel={t('branchReviews')}
            variant="modal"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
