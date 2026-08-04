import React from 'react';
import { View } from 'react-native';

import Favorite from '@/components/Favorite';
import ProfileActionsMenu from '@/components/profile/ProfileActionsMenu';
import type { TranslationKey } from '@/locales';

interface BarberProfileHeaderActionsProps {
  employeeId: string;
  displayName: string;
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  onScrollToReviews: () => void;
  t: (key: TranslationKey) => string;
}

export default function BarberProfileHeaderActions({
  employeeId,
  displayName,
  shareUrl,
  shareTitle,
  shareEmailSubject,
  shareEmailBody,
  onScrollToReviews,
  t,
}: BarberProfileHeaderActionsProps) {
  return (
    <View className="shrink-0 flex-row items-center gap-1">
      <Favorite
        productName={displayName}
        title={displayName}
        entityType="employee"
        entityId={employeeId}
        size={22}
      />
      <ProfileActionsMenu
        mode="employee"
        displayName={displayName}
        employeeId={employeeId}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        shareEmailSubject={shareEmailSubject}
        shareEmailBody={shareEmailBody}
        onScrollToReviews={onScrollToReviews}
        t={t}
      />
    </View>
  );
}
