import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getEmployeeById,
  getEmployees,
  type EmployeeDetail,
  type EmployeeMediaItem,
} from '@/api/employees';
import { getEntityReviews, type EntityReviewItem } from '@/api/reviews';
import { useAuth } from '@/app/contexts/AuthContext';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import { buildOwnReviewIds, computeReviewStats } from '@/utils/barberDetailHelpers';
import { getMockReviews } from '@/utils/mockReviews';

export function useBarberDetailScreen(id: string) {
  const { apiToken, client } = useAuth();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<EmployeeMediaItem | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [reviews, setReviews] = useState<EntityReviewItem[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [ownReviewIds, setOwnReviewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDescription(null);
    const listPromise = CLIENT_APP_V1_ENABLED
      ? Promise.resolve([] as EmployeeDetail[])
      : getEmployees(apiToken, { includeReviews: true, reviewsLimit: 1 }).catch(
          () => [] as EmployeeDetail[]
        );

    Promise.all([getEmployeeById(apiToken, id), listPromise])
      .then(([detail, list]) => {
        setEmployee(detail);
        const arr = (Array.isArray(list) ? list : Object.values(list)) as EmployeeDetail[];
        const fromList = arr.find((e) => e.id === id);
        const text =
          (typeof detail.description === 'string' && detail.description.trim()) ||
          (typeof fromList?.description === 'string' && fromList.description.trim()) ||
          '';
        setDescription(text || null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    if (!client?.id || reviews.length === 0) return;
    setOwnReviewIds((prev) => {
      const ids = new Set(prev);
      reviews.forEach((r) => {
        if (r.client?.id != null && String(r.client.id) === String(client.id)) ids.add(r.id);
      });
      return ids;
    });
  }, [client?.id, reviews]);

  const loadReviews = useCallback(() => {
    if (!apiToken || !id) return;
    setLoadingReviews(true);
    getEntityReviews(apiToken, 'employee', id, { page: 1, limit: 9999, includeOwn: true })
      .then((data) => {
        const mock = getMockReviews(id);
        setReviews([...data.reviews, ...mock]);
        setReviewsTotal((data.pagination.total ?? 0) + mock.length);
        setHasReviewed(!!data.hasReviewed);
        setOwnReviewIds(buildOwnReviewIds(data, client?.id));
      })
      .catch(() => {
        const mock = getMockReviews(id);
        setReviews(mock);
        setReviewsTotal(mock.length);
        setHasReviewed(false);
        setOwnReviewIds(new Set());
      })
      .finally(() => setLoadingReviews(false));
  }, [apiToken, id, client?.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useFocusEffect(
    useCallback(() => {
      if (!apiToken || !id) return;
      getEntityReviews(apiToken, 'employee', id, { page: 1, limit: 9999, includeOwn: true })
        .then((data) => {
          const mock = getMockReviews(id);
          setReviews([...data.reviews, ...mock]);
          setReviewsTotal((data.pagination.total ?? 0) + mock.length);
          setHasReviewed(!!data.hasReviewed);
          setOwnReviewIds(buildOwnReviewIds(data, client?.id));
        })
        .catch(() => {});
    }, [apiToken, id, client?.id])
  );

  const {
    countByRating,
    average,
    total: reviewsComputedTotal,
  } = useMemo(() => computeReviewStats(reviews), [reviews]);
  const displayTotal = reviewsTotal ?? reviewsComputedTotal;

  return {
    employee,
    loading,
    error,
    description,
    reviews,
    reviewsTotal,
    loadingReviews,
    hasReviewed,
    ownReviewIds,
    expandedCategoryId,
    setExpandedCategoryId,
    fullscreenMedia,
    setFullscreenMedia,
    countByRating,
    average,
    displayTotal,
  };
}
