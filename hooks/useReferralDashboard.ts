import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useRef, useState } from 'react';

import {
  getClientReferrals,
  postReferralShareLink,
  type ClientReferralsResponse,
} from '@/api/referrals';
import { CrmHttpError } from '@/api/http';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { shouldStaleRefresh } from '@/utils/staleRefresh';

export function useReferralDashboard() {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<ClientReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);

  const load = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (!apiToken) return;
      if (!shouldStaleRefresh(lastFetchRef.current, options)) return;
      if (inflightRef.current) return inflightRef.current;

      const isInitial = lastFetchRef.current === 0;
      if (isInitial && !options?.silent) {
        setLoading(true);
        setError(null);
      }

      inflightRef.current = (async () => {
        try {
          const dashboard = await getClientReferrals(apiToken);
          setData(dashboard);
          lastFetchRef.current = Date.now();
        } catch (e) {
          setError(e instanceof Error ? e.message : t('referralLoadError'));
        } finally {
          setLoading(false);
          inflightRef.current = null;
        }
      })();

      return inflightRef.current;
    },
    [apiToken, t]
  );

  useFocusEffect(
    useCallback(() => {
      void load({ silent: lastFetchRef.current > 0 });
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load({ force: true });
    setRefreshing(false);
  }, [load]);

  return { data, loading, refreshing, error, refresh, reload: load };
}

export async function ensureReferralShareUrl(
  apiToken: string,
  dashboard: ClientReferralsResponse | null
): Promise<string> {
  const existing = dashboard?.shareLink?.url?.trim();
  if (existing) return existing;

  const link = await postReferralShareLink(apiToken);
  return link.shareUrl;
}

export function mapReferralShareError(
  error: unknown,
  t: (key: import('@/locales').TranslationKey) => string
): string {
  if (error instanceof CrmHttpError) {
    if (error.status === 401) return t('referralShareErrorAuth');
    if (error.status === 403) return t('referralShareErrorUnavailable');
  }
  return t('referralShareErrorGeneric');
}
