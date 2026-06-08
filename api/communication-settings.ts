import { CrmHttpError, fetchCrm } from './http';

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
  try {
    const json = await fetchCrm<CommunicationSettingsResponse>(
      '/api/client/communication-settings',
      { apiToken }
    );
    return normalizeSettings(json);
  } catch (e) {
    if (e instanceof CrmHttpError && e.status === 404) throw new Error('Not found');
    throw e;
  }
}

/** PATCH /api/client/communication-settings */
export async function patchCommunicationSettings(
  apiToken: string,
  body: PatchCommunicationSettingsBody
): Promise<CommunicationSettingsResponse> {
  try {
    const json = await fetchCrm<CommunicationSettingsResponse>(
      '/api/client/communication-settings',
      { method: 'PATCH', apiToken, body }
    );
    return normalizeSettings(json);
  } catch (e) {
    if (e instanceof CrmHttpError) {
      if (e.status === 400) throw new Error('Bad request');
      if (e.status === 404) throw new Error('Not found');
    }
    throw e;
  }
}
