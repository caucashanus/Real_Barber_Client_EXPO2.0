import { useFocusEffect } from "expo-router/react-navigation";
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicServicePage } from '@/api/publicServicePage';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ackListingFetch,
  shouldRefetchListing,
} from '@/lib/availability/listingCache';
import {
  mapPublicServiceToDetail,
  type CatalogServiceDetail,
} from '@/utils/serviceDetailHelpers';
import { groupNearestBranchSlots } from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

const pageCache = new Map<string, { fetchedAt: number; detail: CatalogServiceDetail | null }>();

type LoadPageOptions = {
  background?: boolean;
  force?: boolean;
};

export function useServiceDetailScreen(idOrSlug: string) {
  const { locale } = useLanguage();

  const [detail, setDetail] = useState<CatalogServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayIso = useMemo(() => getPragueTodayDateString(), []);
  const listingKey = useMemo(
    () => `service:${idOrSlug}:${todayIso}`,
    [idOrSlug, todayIso]
  );

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!idOrSlug) {
        setLoading(false);
        return;
      }

      const cached = pageCache.get(listingKey);
      const cachedAt = cached?.fetchedAt ?? 0;
      if (!options?.force && cached && !shouldRefetchListing(listingKey, cachedAt)) {
        setDetail(cached.detail);
        setError(cached.detail ? null : 'not-found');
        setLoading(false);
        return;
      }

      if (!options?.background) {
        setLoading(true);
      }
      setError(null);

      try {
        const service = await fetchPublicServicePage(idOrSlug, {
          date: todayIso,
          bustCache: options?.force,
        });
        if (!service) {
          pageCache.set(listingKey, { fetchedAt: Date.now(), detail: null });
          ackListingFetch(listingKey);
          setDetail(null);
          setError('not-found');
          return;
        }

        const nextDetail = mapPublicServiceToDetail(service, locale);
        pageCache.set(listingKey, { fetchedAt: Date.now(), detail: nextDetail });
        ackListingFetch(listingKey);
        setDetail(nextDetail);
      } catch {
        if (!options?.background) {
          setDetail(null);
          setError('load-error');
        }
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [idOrSlug, listingKey, locale, todayIso]
  );

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage({ background: true }).catch(() => {});
    }, [loadPage])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage({ force: true, background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadPage]);

  const slotGroups = useMemo(() => {
    if (!detail?.nearestSlots.length) return [];
    return groupNearestBranchSlots(detail.nearestSlots, locale, todayIso);
  }, [detail?.nearestSlots, locale, todayIso]);

  return {
    detail,
    loading,
    refreshing,
    refresh,
    error,
    slotGroups,
    locale,
    todayIso,
  };
}
