import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CRM_BASE = 'https://crm.xrb.cz';

export interface CrmClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  address: string;
  whatsapp: string | null;
  birthday: string | null;
  lastVisit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  client: CrmClient;
  token: string;
  apiToken: string;
}

export async function loginWithPhone(
  phone: string,
  password: string
): Promise<LoginResponse> {
  const platform = Platform.OS as string;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const res = await fetch(`${CRM_BASE}/api/client/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phone.trim(),
      password,
      platform,
      appVersion,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(res.status === 401 ? 'Nesprávné údaje' : errBody || `Chyba ${res.status}`);
  }

  return res.json() as Promise<LoginResponse>;
}
