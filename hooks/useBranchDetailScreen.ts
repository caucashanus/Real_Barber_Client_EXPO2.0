import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getBranchById, type Branch } from '@/api/branches';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import type { Locale } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { resolveInternalBranchIdFromCrmUuid } from '@/constants/crmBranchIds';
import { computeReviewStats } from '@/utils/barberDetailHelpers';
import { fetchBranchHomeSlotsCatalog, getBranchHomeSlotsFromCatalog } from '@/utils/fetchBranchHomeSlotsCatalog';
import { getMockReviews } from '@/utils/mockReviews';
import {
  groupNearestBranchSlots,
  type NearestBranchHomeSlot,
} from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

export function useBranchDetailScreen(id: string) {
  const { apiToken } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [branchSlots, setBranchSlots] = useState<NearestBranchHomeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getBranchById(apiToken, id)
      .then((found) => {
        setBranch(found);
      })
      .catch((e) => {
        setBranch(null);
        setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    if (!apiToken || !branch?.id) return;
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'branch', branch.id, { page: 1, limit: 9999, includeOwn: true })
      .then((data) => {
        const mock = getMockReviews(branch.id);
        setReviews([...data.reviews, ...mock]);
        setReviewsTotal((data.pagination.total ?? 0) + mock.length);
        setHasReviewed(!!data.hasReviewed);
      })
      .catch(() => {
        const mock = getMockReviews(branch.id);
        setReviews(mock);
        setReviewsTotal(mock.length);
        setHasReviewed(false);
      })
      .finally(() => setLoadingReviews(false));
  }, [apiToken, branch?.id]);

  useEffect(() => {
    if (!apiToken) return;
    setLoadingSlots(true);
    fetchBranchHomeSlotsCatalog({ apiToken, locale: locale as Locale, t, todayIso })
      .then((catalog) => {
        const internalId = resolveInternalBranchIdFromCrmUuid(id);
        setBranchSlots(internalId ? getBranchHomeSlotsFromCatalog(catalog, internalId) : []);
      })
      .catch(() => setBranchSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [apiToken, id, locale, t, todayIso]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken || !branch?.id) return;
      getEntityReviews(apiToken, 'branch', branch.id, { page: 1, limit: 9999, includeOwn: true })
        .then((data) => {
          const mock = getMockReviews(branch.id);
          setReviews([...data.reviews, ...mock]);
          setReviewsTotal((data.pagination.total ?? 0) + mock.length);
          setHasReviewed(!!data.hasReviewed);
        })
        .catch(() => {});
    }, [apiToken, branch?.id])
  );

  const internalBranchId = useMemo(
    () => resolveInternalBranchIdFromCrmUuid(branch?.id ?? id),
    [branch?.id, id]
  );

  const slotGroups = useMemo(
    () => groupNearestBranchSlots(branchSlots, locale as Locale, todayIso),
    [branchSlots, locale, todayIso]
  );

  const {
    countByRating,
    average,
    total: reviewsComputedTotal,
  } = useMemo(() => computeReviewStats(reviews), [reviews]);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;

  return {
    branch,
    loading,
    error,
    reviews,
    loadingReviews,
    hasReviewed,
    ratingModalVisible,
    setRatingModalVisible,
    countByRating,
    average,
    displayTotal,
    internalBranchId,
    slotGroups,
    loadingSlots,
    locale,
  };
}
