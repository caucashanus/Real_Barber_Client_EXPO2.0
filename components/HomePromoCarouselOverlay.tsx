import React from 'react';
import { View } from 'react-native';

import AppButton from '@/components/AppButton';

/** Promo carousel CTA — mírně větší než standardní choice chip. */
const PROMO_CTA_BUTTON_CLASS = 'h-9 rounded-lg px-3 py-1.5';
const PROMO_CTA_BUTTON_TEXT_CLASS = 'text-sm font-semibold leading-tight';

export interface HomePromoCarouselOverlaySlide {
  buttonText: string | null;
  /** Pouze pro screen reader, když buttonText chybí. */
  accessibilityFallback: string;
}

interface HomePromoCarouselOverlayProps {
  slide: HomePromoCarouselOverlaySlide;
  width: number;
  height: number;
}

export function getHomePromoSlideAccessibilityLabel(
  slide: HomePromoCarouselOverlaySlide
): string {
  return slide.buttonText?.trim() || slide.accessibilityFallback.trim();
}

export function HomePromoCarouselOverlay({
  slide,
  width,
  height,
}: HomePromoCarouselOverlayProps) {
  const label = slide.buttonText?.trim();
  if (!label) return null;

  return (
    <View className="absolute inset-0" style={{ width, height }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          paddingHorizontal: 16,
          paddingBottom: 12,
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          zIndex: 20,
        }}>
        <AppButton
          variant="choice"
          size="sm"
          title={label}
          disableHaptic
          className={PROMO_CTA_BUTTON_CLASS}
          textClassName={PROMO_CTA_BUTTON_TEXT_CLASS}
        />
      </View>
    </View>
  );
}
