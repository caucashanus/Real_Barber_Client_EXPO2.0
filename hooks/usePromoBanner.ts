import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { fetchPromoBanner, type PromoBanner } from '@/api/promoBanner';
import {
  readDismissedPromoBannerId,
  writeDismissedPromoBannerId,
} from '@/utils/promoBannerStorage';

function shouldFetchPromoBanner(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function usePromoBanner(): {
  banner: PromoBanner | null;
  visible: boolean;
  dismiss: () => void;
  openCta: () => void;
} {
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [visible, setVisible] = useState(false);

  const persistDismiss = useCallback(async (bannerId: string) => {
    await writeDismissedPromoBannerId(bannerId);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!shouldFetchPromoBanner()) return;

    let cancelled = false;

    void (async () => {
      try {
        const [dismissedId, next] = await Promise.all([
          readDismissedPromoBannerId(),
          fetchPromoBanner(),
        ]);
        if (cancelled) return;
        if (!next) {
          setBanner(null);
          setVisible(false);
          return;
        }
        setBanner(next);
        setVisible(dismissedId !== next.id);
      } catch {
        if (!cancelled) {
          setBanner(null);
          setVisible(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    if (!banner) return;
    void persistDismiss(banner.id);
  }, [banner, persistDismiss]);

  const openCta = useCallback(() => {
    if (!banner?.ctaUrl?.trim()) return;
    void persistDismiss(banner.id);
    void Linking.openURL(banner.ctaUrl.trim()).catch(() => {});
  }, [banner, persistDismiss]);

  return { banner, visible, dismiss, openCta };
}
