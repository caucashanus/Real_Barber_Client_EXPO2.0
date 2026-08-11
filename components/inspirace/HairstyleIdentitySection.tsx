import React from 'react';
import { View } from 'react-native';

import Favorite from '@/components/Favorite';
import ProfileActionsMenu from '@/components/profile/ProfileActionsMenu';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface HairstyleIdentitySectionProps {
  serviceId: string;
  title: string;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  bookingHref: string;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function HairstyleIdentitySection({
  serviceId,
  title,
  shareUrl,
  shareTitle,
  shareEmailSubject,
  shareEmailBody,
  bookingHref,
  onScrollToReviews,
  t,
}: HairstyleIdentitySectionProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">
        <ThemedText className="text-2xl font-semibold" numberOfLines={3}>
          {title}
        </ThemedText>
      </View>

      <View className="flex-row items-center gap-1">
        <Favorite entityType="service" entityId={serviceId} size={20} />
        <ProfileActionsMenu
          mode="service"
          displayName={title}
          shareUrl={shareUrl}
          shareTitle={shareTitle}
          shareEmailSubject={shareEmailSubject}
          shareEmailBody={shareEmailBody}
          bookingHref={bookingHref}
          onScrollToReviews={onScrollToReviews}
          t={t}
        />
      </View>
    </View>
  );
}
