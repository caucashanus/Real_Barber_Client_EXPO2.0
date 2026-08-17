import React from 'react';
import { View } from 'react-native';

import Favorite from '@/components/Favorite';
import IsNewBadge from '@/components/shared/IsNewBadge';
import ProfileActionsMenu from '@/components/profile/ProfileActionsMenu';
import ThemedText from '@/components/ThemedText';
import type { TranslationKey } from '@/locales';

interface ServiceDetailIdentitySectionProps {
  itemId: string;
  title: string;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  bookingHref: string;
  isNew?: boolean;
  t: (key: TranslationKey) => string;
}

export default function ServiceDetailIdentitySection({
  itemId,
  title,
  shareUrl,
  shareTitle,
  shareEmailSubject,
  shareEmailBody,
  bookingHref,
  isNew = false,
  t,
}: ServiceDetailIdentitySectionProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">
        <ThemedText className="text-2xl font-semibold" numberOfLines={3}>
          {title}
        </ThemedText>
        {isNew ? (
          <View className="mt-1 self-start">
            <IsNewBadge />
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1">
        <Favorite entityType="item" entityId={itemId} size={20} />
        <ProfileActionsMenu
          mode="service"
          displayName={title}
          shareUrl={shareUrl}
          shareTitle={shareTitle}
          shareEmailSubject={shareEmailSubject}
          shareEmailBody={shareEmailBody}
          bookingHref={bookingHref}
          onScrollToReviews={() => {}}
          t={t}
        />
      </View>
    </View>
  );
}
