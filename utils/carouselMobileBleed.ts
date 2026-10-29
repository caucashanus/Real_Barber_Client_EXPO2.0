/**
 * Mobilní carousel bleed — parita web `carousel-mobile-bleed.ts`.
 * App page gutter = `px-global` (24 px); web `SiteContentShell` = `px-5` (20 px).
 */

/** Horizontální gutter obsahu home (`ThemeScroller` `px-global`). */
export const SITE_CAROUSEL_PAGE_GUTTER_PX = 24;

/** Vnější obal: zruší page padding → viewport = plná šířka obrazovky. */
export const CAROUSEL_BLEED_OUTER_CLASSNAME = '-mx-global';
