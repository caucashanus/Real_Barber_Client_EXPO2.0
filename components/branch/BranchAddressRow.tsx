import { Image } from 'expo-image';
import React from 'react';
import { Linking, Pressable, View } from 'react-native';

import type { Branch } from '@/api/branches';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';
import { BRANCH_MARKER_IMAGES, getMapsUrl } from '@/utils/branchDetailHelpers';

interface BranchAddressRowProps {
  branch: Branch;
  t: (key: TranslationKey) => string;
}

export default function BranchAddressRow({ branch, t }: BranchAddressRowProps) {
  return (
    <Pressable
      onPress={() => {
        const url = getMapsUrl(branch);
        if (url) Linking.openURL(url);
      }}
      className="mb-2 mt-8 flex-row items-center border-y border-neutral-200 py-global active:opacity-80 dark:border-dark-secondary">
      {BRANCH_MARKER_IMAGES[branch.name] ? (
        <Image
          source={BRANCH_MARKER_IMAGES[branch.name]}
          className="mr-4 h-12 w-12 rounded-lg"
          contentFit="contain"
        />
      ) : (
        <Avatar size="md" name={branch.name} className="mr-4" />
      )}
      <View className="ml-0">
        <ThemedText variant="emphasis">{t('branchTitle')}</ThemedText>
        <View className="flex-row items-center">
          <Icon name="MapPin" size={12} className="mr-1" />
          <ThemedText
            className="text-xs text-light-subtext dark:text-dark-subtext"
            numberOfLines={1}>
            {branch.address ?? t('branchAddressNotSet')}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}
