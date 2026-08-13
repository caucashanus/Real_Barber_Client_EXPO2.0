import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicServicePage } from '@/api/publicServicePage';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  mapPublicServiceToDetail,
  type CatalogServiceDetail,
} from '@/utils/serviceDetailHelpers';
import { groupNearestBranchSlots } from '@/utils/nearestBranchHomeSlots';
import { getPragueTodayDateString } from '@/utils/teamMemberPageHelpers';

type LoadPageOptions = {
  background?: boolean;
  bustCache?: boolean;
};

export function useServiceDetailScreen(idOrSlug: string) {
  const { locale } = useLanguage();

  const [detail, setDetail] = useState<CatalogServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayIso = useMemo(() => getPragueTodayDateString(), []);

  const loadPage = useCallback(
    async (options?: LoadPageOptions) => {
      if (!idOrSlug) {
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
          bustCache: options?.bustCache,
        });
        if (!service) {
          setDetail(null);
          setError('not-found');
          return;
        }

        setDetail(mapPublicServiceToDetail(service, locale));
      } catch {
        setDetail(null);
        setError('load-error');
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [idOrSlug, locale, todayIso]
  );

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  useFocusEffect(
    useCallback(() => {
      loadPage({ background: true, bustCache: true }).catch(() => {});
    }, [loadPage])
  );

  const slotGroups = useMemo(() => {
    if (!detail?.nearestSlots.length) return [];
    return groupNearestBranchSlots(detail.nearestSlots, locale, todayIso);
  }, [detail?.nearestSlots, locale, todayIso]);

  return {
    detail,
    loading,
    error,
    slotGroups,
    locale,
    todayIso,
  };
}
