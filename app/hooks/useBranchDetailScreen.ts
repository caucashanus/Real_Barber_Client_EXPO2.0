import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getBranchById, type Branch } from '@/api/branches';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { computeReviewStats } from '@/utils/barberDetailHelpers';
import { getMockReviews } from '@/utils/mockReviews';

export function useBranchDetailScreen(id: string) {
  const { apiToken } = useAuth();

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

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
    descriptionModalVisible,
    setDescriptionModalVisible,
    ratingModalVisible,
    setRatingModalVisible,
    countByRating,
    average,
    displayTotal,
  };
}
