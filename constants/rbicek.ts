import Constants from 'expo-constants';

import { PRODUCTION_WEB_ORIGIN } from '@/constants/bookingMonitor';
import { getFlowSnapshotConstants } from '@/lib/rbicek/flow/snapshot';

const flowConstants = getFlowSnapshotConstants();

/** Feature flags — parity with web `@rbicek/widget` (from flow-snapshot.json). */
export const RBICEK_LIVE_OPERATOR_ENABLED = flowConstants.liveOperatorEnabled;
export const RBICEK_HISTORY_UI_ENABLED = false;

export const RBICEK_ACCENT_DEFAULT = '#ff4f31';
export const RBICEK_CRM_BASE = 'https://crm.xrb.cz';
export const RBICEK_MAX_CHIPS = flowConstants.maxResponseOptions;
export const RBICEK_CONVERSATION_TTL_MS = flowConstants.conversationTtlMs;
export const RBICEK_IDLE_REMINDER_MS = 3 * 60 * 1000;
export const RBICEK_STORAGE_KEY = '@rb_rbicek_conversation_v1';
export const RBICEK_SUPPORT_CONTACT_SECRET_KEY = '@rb_rbicek_support_contact_secret_v1';

const DEFAULT_PUBLIC_KEY = 'pk_7689b05b8313d48db773c61a478d2689';
const DEFAULT_SUPPORT_BASE = 'https://support.xrb.cz';

const extra = Constants.expoConfig?.extra as
  | {
      rbicekPublicKey?: string;
      customerAiPublicKey?: string;
      rbicekSupportBaseUrl?: string;
      customerAiWidgetSrc?: string;
    }
  | undefined;

function readPublicKey(): string {
  return (
    process.env.EXPO_PUBLIC_RBICEK_PUBLIC_KEY?.trim() ||
    process.env.EXPO_PUBLIC_CUSTOMERAI_PUBLIC_KEY?.trim() ||
    extra?.rbicekPublicKey?.trim() ||
    extra?.customerAiPublicKey?.trim() ||
    DEFAULT_PUBLIC_KEY
  );
}

function readSupportBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_RBICEK_SUPPORT_BASE_URL?.trim() ||
    process.env.EXPO_PUBLIC_SUPPORT_BASE_URL?.trim() ||
    extra?.rbicekSupportBaseUrl?.trim() ||
    DEFAULT_SUPPORT_BASE
  ).replace(/\/$/, '');
}

export const RBICEK_PUBLIC_KEY = readPublicKey();
export const RBICEK_SUPPORT_BASE_URL = readSupportBaseUrl();
export const RBICEK_WEB_BASE_URL = PRODUCTION_WEB_ORIGIN;

export function isRbicekEnabled(): boolean {
  return RBICEK_PUBLIC_KEY.startsWith('pk_');
}

/** @deprecated Prefer `isRbicekEnabled`. */
export const isCustomerAiEnabled = isRbicekEnabled;
