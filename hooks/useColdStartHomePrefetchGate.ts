import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  defaultColdStartHomePrefetchDate,
  startColdStartHomePrefetch,
} from '@/lib/coldStartHomePrefetch';
import { shouldSuppressInitialHomeLoadingUi } from '@/utils/coldStartHomeLoadingUi';

/** `true` = home prefetch hotový (nebo není potřeba). Splash drží auth bootstrap + tento gate. */
export function useColdStartHomePrefetchGate(apiToken: string | null | undefined): boolean {
  const { locale } = useLanguage();
  const [prefetchDone, setPrefetchDone] = useState(() => !apiToken);

  useEffect(() => {
    if (!apiToken) {
      setPrefetchDone(true);
      return;
    }
    if (!shouldSuppressInitialHomeLoadingUi()) {
      setPrefetchDone(true);
      return;
    }

    setPrefetchDone(false);
    let cancelled = false;

    startColdStartHomePrefetch({
      date: defaultColdStartHomePrefetchDate(),
      locale,
      apiToken,
    }).finally(() => {
      if (!cancelled) setPrefetchDone(true);
    });

    return () => {
      cancelled = true;
    };
  }, [apiToken, locale]);

  if (!apiToken) return true;
  if (!shouldSuppressInitialHomeLoadingUi()) return true;
  return prefetchDone;
}