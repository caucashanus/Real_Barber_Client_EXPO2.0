import type { ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';

import type { HomeReferralPromo } from '@/api/home';
import type { ClientPoster } from '@/api/client-posters';
import type { ClientCoupon } from '@/api/client-coupons';
import { promoKuponHref, promoPosterHref } from '@/constants/promoDetailRoutes';
import type { HomePromoFeedItem } from '@/utils/homePromoFeed';
import { resolveHomeReferralPromoImage } from '@/utils/homePromoFeed';

export type HomePromoCarouselSlide = {
  key: string;
  image: string | ImageSourcePropType;
  displayTitle: string;
  displaySubtitle: string | null;
  accessibilityLabel: string;
  onPress: () => void;
};

function buildReferralSlide(
  referral: HomeReferralPromo,
  referralButtonText: string,
  onReferralPress?: (referral: HomeReferralPromo) => void
): HomePromoCarouselSlide {
  const label = referralButtonText.trim() || 'Promo';
  return {
    key: 'referral-home',
    image: resolveHomeReferralPromoImage(referral),
    displayTitle: label,
    displaySubtitle: null,
    accessibilityLabel: label,
    onPress: () => onReferralPress?.(referral),
  };
}

function buildCouponSlide(coupon: ClientCoupon): HomePromoCarouselSlide | null {
  const imageUrl = coupon.imageUrl?.trim();
  if (!imageUrl) return null;
  const name = coupon.name?.trim() || coupon.benefitLabel?.trim() || 'Promo';
  return {
    key: `coupon-${coupon.id}`,
    image: imageUrl,
    displayTitle: name,
    displaySubtitle: null,
    accessibilityLabel: name,
    onPress: () => router.push(promoKuponHref(coupon.id) as never),
  };
}

function buildPosterSlide(poster: ClientPoster): HomePromoCarouselSlide | null {
  const imageUrl = poster.imageUrl?.trim();
  if (!imageUrl) return null;
  const posterTitle = poster.title?.trim() || null;
  const posterSubtitle = poster.subtitle?.trim() || null;
  const name = posterTitle || posterSubtitle || 'Promo';
  return {
    key: `poster-${poster.id}`,
    image: imageUrl,
    displayTitle: posterTitle || posterSubtitle || 'Promo',
    displaySubtitle: posterTitle ? posterSubtitle : null,
    accessibilityLabel: name,
    onPress: () => router.push(promoPosterHref(poster.id) as never),
  };
}

export function buildHomePromoCarouselSlides(
  feed: HomePromoFeedItem[],
  options: {
    referralButtonText: string;
    onReferralPress?: (referral: HomeReferralPromo) => void;
  }
): HomePromoCarouselSlide[] {
  const slides: HomePromoCarouselSlide[] = [];
  for (const item of feed) {
    if (item.kind === 'referral') {
      slides.push(
        buildReferralSlide(item.referral, options.referralButtonText, options.onReferralPress)
      );
      continue;
    }
    if (item.kind === 'coupon') {
      const slide = buildCouponSlide(item.coupon);
      if (slide) slides.push(slide);
      continue;
    }
    const slide = buildPosterSlide(item.poster);
    if (slide) slides.push(slide);
  }
  return slides;
}

export function homePromoSlideAccessibilityLabel(slide: HomePromoCarouselSlide): string {
  const subtitle = slide.displaySubtitle?.trim();
  if (subtitle) return `${slide.displayTitle}. ${subtitle}`;
  return slide.displayTitle;
}
