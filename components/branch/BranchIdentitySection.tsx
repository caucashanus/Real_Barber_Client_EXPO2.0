import React, { useMemo } from 'react';
import { View } from 'react-native';

import LiveIndicator from '@/components/LiveIndicator';
import RatingBadge from '@/components/RatingBadge';
import IsNewBadge from '@/components/shared/IsNewBadge';
import Avatar from '@/components/Avatar';
import Favorite from '@/components/Favorite';
import ProfileActionsMenu from '@/components/profile/ProfileActionsMenu';
import ThemedText from '@/components/ThemedText';
import { getBranchInteriorCarouselImages } from '@/constants/branchInteriorGallery';
import type { BranchInternalId } from '@/constants/crmBranchIds';
import type { TranslationKey } from '@/locales';
import { getBranchOpenLiveVariant } from '@/utils/branchOpenStatusLive';
import { getBranchOpenStatus } from '@/utils/branchOpenStatus';

interface BranchIdentitySectionProps {
  branchId: string;
  branchName: string;
  internalBranchId?: BranchInternalId;
  average: number;
  locale: 'cs' | 'en';
  shareUrl: string;
  shareTitle: string;
  shareEmailSubject: string;
  shareEmailBody: string;
  rateUrl: string | null;
  bookingHref: string;
  onScrollToReviews: () => void;
  isNew?: boolean;
  t: (key: TranslationKey) => string;
}

export default function BranchIdentitySection({
  branchId,
  branchName,
  internalBranchId,
  average,
  locale,
  shareUrl,
  shareTitle,
  shareEmailSubject,
  shareEmailBody,
  rateUrl,
  bookingHref,
  onScrollToReviews,
  isNew = false,
  t,
}: BranchIdentitySectionProps) {
  const openVariant = getBranchOpenLiveVariant(getBranchOpenStatus());

  const avatarSource = useMemo(() => {
    if (!internalBranchId) return undefined;
    const images = getBranchInteriorCarouselImages(internalBranchId);
    const first = images[0];
    if (typeof first === 'string') return first;
    return first;
  }, [internalBranchId]);

  return (
    <View>
      <View className="flex-row items-start gap-3">
        <Avatar size="lg" src={avatarSource} name={branchName} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 items-start">
              <View className="max-w-full flex-row items-center">
                <ThemedText className="shrink text-lg font-semibold" numberOfLines={2}>
                  {branchName}
                </ThemedText>
                <View className="ml-2 justify-center">
                  <LiveIndicator variant={openVariant} size="default" />
                </View>
              </View>

              {average > 0 ? (
                <View className="mt-2">
                  {isNew ? (
                    <View className="flex-row flex-wrap items-center">
                      <RatingBadge
                        rating={average}
                        locale={locale}
                        compact={false}
                        onPress={onScrollToReviews}
                        className="!pl-0"
                      />
                      <View className="ml-2">
                        <IsNewBadge />
                      </View>
                    </View>
                  ) : (
                    <RatingBadge
                      rating={average}
                      locale={locale}
                      compact={false}
                      onPress={onScrollToReviews}
                      className="!pl-0"
                    />
                  )}
                </View>
              ) : isNew ? (
                <View className="mt-2">
                  <IsNewBadge />
                </View>
              ) : null}
            </View>

            <View className="shrink-0 flex-row items-center gap-1">
              <Favorite
                productName={branchName}
                title={branchName}
                entityType="branch"
                entityId={branchId}
                size={22}
              />
              <ProfileActionsMenu
                mode="branch"
                displayName={branchName}
                shareUrl={shareUrl}
                shareTitle={shareTitle}
                shareEmailSubject={shareEmailSubject}
                shareEmailBody={shareEmailBody}
                rateUrl={rateUrl}
                bookingHref={bookingHref}
                t={t}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
