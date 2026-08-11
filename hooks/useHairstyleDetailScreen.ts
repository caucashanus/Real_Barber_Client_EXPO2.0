import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getPublicEntityReviews } from '@/api/publicTeamMember';
import type { EntityReviewItem } from '@/api/reviews';
import { fetchPublicHairstylePage } from '@/api/publicHairstylePage';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeReviewStats } from '@/utils/barberDetailHelpers';
import {
  buildHairstyleReviewParams,
  mapHairstyleToServiceDetail,
  type HairstyleServiceDetail,
} from '@/utils/inspiraceServiceDetailHelpers';
import {
  groupNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

function mapPublicReviewToEntityReview(
  review: {
    id: string;
    rating: number;
    text?: string | null;
    authorName?: string | null;
    authorAvatarUrl?: string | null;
    createdAt?: string | null;
    images?: string[];
  },
  entityId: string
): EntityReviewItem {
  return {
    id: review.id,
    rating: review.rating,
    positiveFeedback: review.text ?? null,
    negativeFeedback: null,
    description: review.text ?? null,
    images: review.images ?? [],
    isAnonymous: !review.authorName?.trim(),
    createdAt: review.createdAt ?? new Date().toISOString(),
    updatedAt: review.createdAt ?? new Date().toISOString(),
    client: {
      id: review.id,
      name: review.authorName?.trim() || 'Anonymous',
      firstName: review.authorName?.trim() || null,
      lastName: null,
      avatarUrl: review.authorAvatarUrl ?? null,
    },
    entityType: 'service',
    entityId,
  };
}

export function useHairstyleDetailScreen(idOrSlug: string) {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();

  const [detail, setDetail] = useState<HairstyleServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPublicHairstylePage(idOrSlug)
      .then((hairstyle) => {
        if (!hairstyle) {
          setDetail(null);
          setError('not-found');
          return;
        }
        setDetail(mapHairstyleToServiceDetail(hairstyle, locale));
      })
      .catch(() => setError('load-error'))
      .finally(() => setLoading(false));
  }, [idOrSlug, locale]);

  useEffect(() => {
    if (!detail?.id) return;
    setLoadingReviews(true);
    getPublicEntityReviews('service', detail.id, { limit: 20, offset: 0 })
      .then((data) => {
        setReviews((data.reviews ?? []).map((review) => mapPublicReviewToEntityReview(review, detail.id)));
        setHasReviewed(false);
      })
      .catch(() => {
        setReviews([]);
        setHasReviewed(false);
      })
      .finally(() => setLoadingReviews(false));
  }, [detail?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!detail?.id || !apiToken) return;
      // Client reviews refresh could go here when API supports service entity.
    }, [apiToken, detail?.id])
  );

  const slotGroups = useMemo(() => {
    if (!detail?.nearestSlots.length) return [];
    return groupNearestBranchSlots(detail.nearestSlots, locale, todayIso);
  }, [detail?.nearestSlots, locale, todayIso]);

  const reviewParams = detail
    ? buildHairstyleReviewParams(detail.id, detail.title, detail.heroSlides[0]?.src)
    : '';

  const { average, countByRating, total: displayTotal } = useMemo(
    () => computeReviewStats(reviews),
    [reviews]
  );

  return {
    detail,
    loading,
    error,
    reviews,
    loadingReviews,
    hasReviewed,
    reviewParams,
    average,
    countByRating,
    displayTotal,
    slotGroups,
    locale,
    todayIso,
  };
}

export type { NearestBranchHomeSlot };
