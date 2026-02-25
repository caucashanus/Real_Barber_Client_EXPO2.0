const CRM_BASE = 'https://crm.xrb.cz';

export interface ClientMe {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  displayName: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  whatsapp: string | null;
  birthday: string | null;
  lastVisit: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/client/me – current client information. */
export async function getClientMe(apiToken: string): Promise<ClientMe> {
  const res = await fetch(`${CRM_BASE}/api/client/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientMe>;
}

export interface UpdateClientMeBody {
  avatar?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  bio?: string;
  displayName?: string;
  language?: string;
  birthday?: string;
  address?: { street?: string; city?: string; zip?: string; country?: string };
}

/** PATCH /api/client/me – update current client profile (partial). */
export async function patchClientMe(
  apiToken: string,
  body: UpdateClientMeBody
): Promise<ClientMe> {
  const res = await fetch(`${CRM_BASE}/api/client/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 400) throw new Error('Invalid input data');
  if (res.status === 409) throw new Error('Phone number already exists');
  if (res.status === 500) throw new Error('Failed to update profile');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json() as Promise<ClientMe>;
}
