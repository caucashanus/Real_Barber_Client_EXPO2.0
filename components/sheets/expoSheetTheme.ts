/** Stejné jako `colors.sheet` / `ActionSheetThemed` — light #fff, dark #0F0F0F. */
export const EXPO_SHEET_BACKGROUND = {
  light: '#ffffff',
  dark: '#0F0F0F',
} as const;

export const EXPO_SHEET_TOP_RADIUS = 20;

export const SHEET_SURFACE_CLASS =
  'overflow-hidden rounded-t-[20px] bg-light-primary dark:bg-dark-primary';

/** Kompaktní menu sheety (Navigovat, Další akce, Zavolat, …). */
export const SHEET_TITLE_CLASS = 'mb-2 text-lg font-semibold leading-7';

export const SHEET_ICON_SIZE = 24;

export const SHEET_ICON_STROKE = 2;

export const SHEET_CLOSE_ICON_SIZE = 24;

/** Nadpis sheetu na střed (feedback, dárkový voucher, …). */
export const SHEET_TITLE_CENTER_CLASS = 'mb-2 text-center text-lg font-semibold leading-7';
