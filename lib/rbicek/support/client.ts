import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  RBICEK_SUPPORT_BASE_URL,
  RBICEK_SUPPORT_CONTACT_SECRET_KEY,
  RBICEK_WEB_BASE_URL,
} from '@/constants/rbicek';
import type { RbicekLocale } from '@/lib/rbicek/types';
import { randomId } from '@/lib/rbicek/utils';

export interface PassiveSupportSession {
  conversationId: string;
  token: string;
}

function supportLocale(locale: RbicekLocale): 'cs' | 'en' {
  return locale === 'en' ? 'en' : 'cs';
}

async function readContactSecret(): Promise<string | undefined> {
  const stored = await AsyncStorage.getItem(RBICEK_SUPPORT_CONTACT_SECRET_KEY).catch(() => null);
  if (stored?.trim()) return stored.trim();
  const generated = randomId('contact');
  await AsyncStorage.setItem(RBICEK_SUPPORT_CONTACT_SECRET_KEY, generated).catch(() => {});
  return generated;
}

export async function openPassiveSupportSession(
  publicKey: string,
  locale: RbicekLocale
): Promise<PassiveSupportSession | null> {
  if (!publicKey.startsWith('pk_')) return null;
  try {
    const contactSecret = await readContactSecret();
    const res = await fetch(`${RBICEK_SUPPORT_BASE_URL}/api/public/conversations`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-widget-origin': RBICEK_WEB_BASE_URL,
      },
      body: JSON.stringify({
        publicKey,
        contactSecret,
        locale: supportLocale(locale),
        mode: 'passive',
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { conversationId?: string; token?: string };
    if (!data.conversationId || !data.token) return null;
    return { conversationId: data.conversationId, token: data.token };
  } catch {
    return null;
  }
}

export async function syncSupportTranscript(
  session: PassiveSupportSession,
  lines: { role: string; text: string }[]
): Promise<void> {
  if (!lines.length) return;
  try {
    await fetch(
      `${RBICEK_SUPPORT_BASE_URL}/api/public/conversations/${encodeURIComponent(session.conversationId)}/transcript`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
          'x-widget-origin': RBICEK_WEB_BASE_URL,
        },
        body: JSON.stringify({ lines: lines.slice(-20) }),
      }
    );
  } catch {
    // best-effort
  }
}
