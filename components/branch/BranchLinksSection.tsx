import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Pressable, View } from 'react-native';

import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface BranchLinksSectionProps {
  branchId: string;
  vrTourUrl: string | null;
  webUrl: string | null;
  t: (key: TranslationKey) => string;
}

export default function BranchLinksSection({
  branchId,
  vrTourUrl,
  webUrl,
  t,
}: BranchLinksSectionProps) {
  return (
    <View className="mb-6">
      {vrTourUrl ? (
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(vrTourUrl)}
          className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
          <Icon name="Box" size={24} className="mr-3" />
          <View className="flex-1">
            <ThemedText className="font-medium">3D VR tour</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {t('branchView3d')}
            </ThemedText>
          </View>
          <Icon name="ChevronRight" size={20} className="opacity-60" />
        </Pressable>
      ) : null}
      {webUrl ? (
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(webUrl)}
          className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
          <Icon name="Globe" size={24} className="mr-3" />
          <View className="flex-1">
            <ThemedText className="font-medium">{t('branchWeb')}</ThemedText>
            <ThemedText
              className="text-sm text-light-subtext dark:text-dark-subtext"
              numberOfLines={1}>
              {webUrl}
            </ThemedText>
          </View>
          <Icon name="ChevronRight" size={20} className="opacity-60" />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => router.push(`/screens/kudy-k-nam-detail?id=${encodeURIComponent(branchId)}`)}
        className="mb-3 flex-row items-center rounded-xl bg-light-secondary p-4 dark:bg-dark-secondary">
        <Icon name="MapPin" size={24} className="mr-3" />
        <View className="flex-1">
          <ThemedText className="font-medium">{t('howToGetToUs')}</ThemedText>
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
            {t('kudyTransportParking')}
          </ThemedText>
        </View>
        <Icon name="ChevronRight" size={20} className="opacity-60" />
      </Pressable>
    </View>
  );
}
