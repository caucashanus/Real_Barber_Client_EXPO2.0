export type WidgetLocale = 'cs' | 'en' | 'uk';

export interface ResolvedWidgetConfig {
  locale: WidgetLocale;
  isLoggedIn: boolean;
  userToken?: string | null;
  userId?: string | null;
  userDisplayName?: string | null;
  webBaseUrl: string;
  apiBaseUrl: string;
}
