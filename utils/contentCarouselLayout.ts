/** Šířka obsahu v ThemeScroller — `px-global` (24 px × 2). */
export const CONTENT_HORIZONTAL_PADDING = 48;

/** 3:2 — promo banner a content carousely (web parity). */
export const CONTENT_CAROUSEL_ASPECT_RATIO = 3 / 2;

export function getContentCarouselSize(screenWidth: number) {
  const width = screenWidth - CONTENT_HORIZONTAL_PADDING;
  return {
    width,
    height: Math.round(width / CONTENT_CAROUSEL_ASPECT_RATIO),
  };
}
