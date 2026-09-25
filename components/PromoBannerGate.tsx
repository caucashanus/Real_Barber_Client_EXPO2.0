import React from 'react';

import PromoBannerOverlay from '@/components/PromoBannerOverlay';
import { usePromoBanner } from '@/hooks/usePromoBanner';

interface PromoBannerGateProps {
  children: React.ReactNode;
}

/** Fullscreen promo from CRM — after force update; dismiss stored locally by banner id. */
export default function PromoBannerGate({ children }: PromoBannerGateProps) {
  const { banner, visible, dismiss, openCta } = usePromoBanner();

  return (
    <>
      {children}
      {banner ? (
        <PromoBannerOverlay
          banner={banner}
          visible={visible}
          onDismiss={dismiss}
          onCtaPress={openCta}
        />
      ) : null}
    </>
  );
}
