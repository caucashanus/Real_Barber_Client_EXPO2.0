/** Obrys listy „Hledáš nejbližší termín?“ + pill Později — stejná šedá na obou. */
export const HOME_FAST_BOOK_LIST_BORDER_LIGHT = '#d4d4d4';
export const HOME_FAST_BOOK_LIST_BORDER_DARK = '#525252';

export function homeFastBookListTriggerBorderColor(isDark: boolean): string {
  return isDark ? HOME_FAST_BOOK_LIST_BORDER_DARK : HOME_FAST_BOOK_LIST_BORDER_LIGHT;
}

/** When panel / dock — stejné jako web drawer elevated. */
export const HOME_FAST_BOOK_WHEN_PANEL_BG = {
  light: '#f5f5f5',
  dark: '#0f0f0f',
} as const;

/** Backdrop modalu služeb (homepage scrim). */
export const HOME_FAST_BOOK_OVERLAY = {
  base: 0.32,
  whenOpen: 0.5,
} as const;

export const HOME_FAST_BOOK_WHEN_STACK_SCRIM = 0.5;

export function homeFastBookWhenPanelBg(isDark: boolean): string {
  return isDark ? HOME_FAST_BOOK_WHEN_PANEL_BG.dark : HOME_FAST_BOOK_WHEN_PANEL_BG.light;
}

/** SiteDrawerBody + fast-book: px-4, gap-4, pt-5. */
export const HOME_FAST_BOOK_SHEET_BODY_CLASS = 'gap-4 px-4 pb-4 pt-5';

/** Sjednocená mřížka — 16 px body + 12 px row = 28 px k ikoně. */
export const HOME_FAST_BOOK_ROW_INSET_PX = 12;

/** Tailwind ekvivalent (nadpisy); u řádků v Pressable raději HomeFastBookRowInset. */
export const HOME_FAST_BOOK_ROW_INSET_CLASS = 'px-3';

/** Mezera pod seznamem služeb před další sekcí (navíc k body gap-4). */
export const HOME_FAST_BOOK_AFTER_SERVICES_CLASS = 'mt-4';

/** Patička sheetu (Dál / Pokračovat) — bez safe-area inset (řeší ActionSheet). */
export const HOME_FAST_BOOK_SHEET_FOOTER = {
  marginTop: 8,
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 24,
} as const;
