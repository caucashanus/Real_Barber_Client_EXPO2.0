/** Šířka obsahu v ThemeScroller — `px-global` (24 px × 2). */
export const CONTENT_HORIZONTAL_PADDING = 48;

export function getContentCarouselSize(screenWidth: number) {
  const width = screenWidth - CONTENT_HORIZONTAL_PADDING;
  return {
    width,
    /** 3:2 aspect — web parity (height = width × 2/3). */
    height: Math.round(width * (2 / 3)),
  };
}
