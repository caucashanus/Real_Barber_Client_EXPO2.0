import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { stripDescriptionPrefix } from '@/utils/branchDetailHelpers';

interface BranchDescriptionModalProps {
  visible: boolean;
  description: string | null | undefined;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

export default function BranchDescriptionModal({
  visible,
  description,
  onClose,
  t,
}: BranchDescriptionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="max-h-[80%] rounded-t-3xl bg-light-primary dark:bg-dark-primary"
          onPress={(e) => e.stopPropagation()}>
          <View className="p-global pb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <ThemedText variant="h4">{t('branchDescription')}</ThemedText>
              <Pressable onPress={onClose} hitSlop={12} className="p-2">
                <Icon name="X" size={24} className="text-light-subtext dark:text-dark-subtext" />
              </Pressable>
            </View>
            <ScrollView className="max-h-96" showsVerticalScrollIndicator>
              <ThemedText className="whitespace-pre-line text-base text-light-subtext dark:text-dark-subtext">
                {description ? stripDescriptionPrefix(description) : ''}
              </ThemedText>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
