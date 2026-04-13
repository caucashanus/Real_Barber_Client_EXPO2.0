const CRM_BASE = 'https://crm.xrb.cz';

export interface CommunicationChannels {
  phoneCall: boolean;
  whatsApp: boolean;
  telegram: boolean;
  sms: boolean;
  email: boolean;
  pushNotification: boolean;
}

export interface CommunicationContentTypes {
  newsAndPromotions: boolean;
  favoriteServicesAndProducts: boolean;
  reviewsAndFeedback: boolean;
  satisfactionSurveys: boolean;
}

export interface CommunicationSettingsResponse {
  clientId: string;
  channels: CommunicationChannels;
  contentTypes: CommunicationContentTypes;
  updatedAt: string;
}

export type PatchCommunicationSettingsBody = {
  channels?: Partial<CommunicationChannels>;
  contentTypes?: Partial<CommunicationContentTypes>;
};

export const DEFAULT_COMMUNICATION_CHANNELS: CommunicationChannels = {
  phoneCall: true,
  whatsApp: true,
  telegram: true,
  sms: true,
  email: true,
  pushNotification: true,
};

export const DEFAULT_COMMUNICATION_CONTENT_TYPES: CommunicationContentTypes = {
  newsAndPromotions: true,
  favoriteServicesAndProducts: true,
  reviewsAndFeedback: true,
  satisfactionSurveys: true,
};

function normalizeSettings(data: CommunicationSettingsResponse): CommunicationSettingsResponse {
  return {
    ...data,
    channels: { ...DEFAULT_COMMUNICATION_CHANNELS, ...data.channels },
    contentTypes: { ...DEFAULT_COMMUNICATION_CONTENT_TYPES, ...data.contentTypes },
  };
}

/** GET /api/client/communication-settings */
export async function getCommunicationSettings(
  apiToken: string
): Promise<CommunicationSettingsResponse> {
  const res = await fetch(`${CRM_BASE}/api/client/communication-settings`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const json = (await res.json()) as CommunicationSettingsResponse;
  return normalizeSettings(json);
}

/** PATCH /api/client/communication-settings */
export async function patchCommunicationSettings(
  apiToken: string,
  body: PatchCommunicationSettingsBody
): Promise<CommunicationSettingsResponse> {
  const res = await fetch(`${CRM_BASE}/api/client/communication-settings`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 400) throw new Error('Bad request');
  if (res.status === 404) throw new Error('Not found');
  if (!res.ok) throw new Error(`Error ${res.status}`);

  const json = (await res.json()) as CommunicationSettingsResponse;
  return normalizeSettings(json);
}
