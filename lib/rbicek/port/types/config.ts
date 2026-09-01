import type { WidgetPlatform } from '@/lib/rbicek/port/types/chat';

export type WidgetLocale = 'cs' | 'en' | 'uk';

export interface ResolvedWidgetConfig {
  locale: WidgetLocale;
  platform?: WidgetPlatform;
  isLoggedIn: boolean;
  userToken?: string | null;
  userId?: string | null;
  userDisplayName?: string | null;
  webBaseUrl: string;
  apiBaseUrl: string;
}
