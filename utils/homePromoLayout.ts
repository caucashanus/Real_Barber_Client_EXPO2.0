/** Web `8.5rem` @ 16px — užší slide + peek další karty vpravo. */
export const HOME_PROMO_VIEWPORT_INSET_PX = 136;

/** Mezera mezi promo slidy (`gap-3`). */
export const HOME_PROMO_SLIDE_GAP_PX = 12;

/** Promo karta — `aspect-[2/1]`. */
export const HOME_PROMO_ASPECT_RATIO = 2;

export type HomePromoCarouselLayout = {
  slideWidth: number;
  imageHeight: number;
  slideGap: number;
};

export function getHomePromoCarouselLayout(screenWidth: number): HomePromoCarouselLayout {
  const slideWidth = Math.max(
    0,
    Math.min(screenWidth, screenWidth - HOME_PROMO_VIEWPORT_INSET_PX)
  );
  return {
    slideWidth,
    imageHeight: Math.round(slideWidth / HOME_PROMO_ASPECT_RATIO),
    slideGap: HOME_PROMO_SLIDE_GAP_PX,
  };
}
