import AsyncStorage from '@react-native-async-storage/async-storage';

import { RBICEK_CONVERSATION_TTL_MS, RBICEK_STORAGE_KEY } from '@/constants/rbicek';
import type { StoredConversation } from '@/lib/rbicek/types';

export async function loadStoredConversation(): Promise<StoredConversation | null> {
  try {
    const raw = await AsyncStorage.getItem(RBICEK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConversation;
    if (!parsed?.id || !Array.isArray(parsed.messages)) return null;
    if (Date.now() - parsed.updatedAt > RBICEK_CONVERSATION_TTL_MS) {
      await AsyncStorage.removeItem(RBICEK_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredConversation(conversation: StoredConversation): Promise<void> {
  try {
    await AsyncStorage.setItem(RBICEK_STORAGE_KEY, JSON.stringify(conversation));
  } catch {
    // ignore quota errors
  }
}

export async function clearStoredConversation(): Promise<void> {
  await AsyncStorage.removeItem(RBICEK_STORAGE_KEY).catch(() => {});
}
