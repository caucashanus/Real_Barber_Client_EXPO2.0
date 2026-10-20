import { postKidsWatch } from '@/lib/kids-watch/postKidsWatch';
import { postKidsWatchCrm } from '@/lib/kids-watch/postKidsWatchCrm';

import type { WaitlistPreferredContact } from '@/lib/waitlist/preferredContact';

/** POST web BFF `/api/kids-watch/` — parita web + Telegram. */
export type KidsWatchSubmitBody = {
  bookingId: string;
  date?: string;
  slot?: string;
  branchName?: string;
  employeeName?: string;
  serviceName?: string;
  usePickupPin: boolean;
  pickupPin: string | null;
  notifyStart: boolean;
  notifyEnd: boolean;
  allowSweetDrink: boolean;
  allowCandy: boolean;
  allowNuts: boolean;
  allowDairy: boolean;
  allowStylingProducts: boolean;
  allowShampooConditioner: boolean;
  haircutPhotoUrls: string[];
  contactPhone: string;
  preferredContact: WaitlistPreferredContact;
  clientEmail?: string;
  clientName?: string;
  note?: string | null;
  isLoggedIn: boolean;
  contactUseProfileDefaults?: boolean;
  source?: 'app';
};

export type KidsWatchSubmitResponse = {
  ok?: boolean;
  id?: string;
};

export async function submitKidsWatch(
  apiToken: string,
  body: KidsWatchSubmitBody
): Promise<KidsWatchSubmitResponse> {
  let result = await postKidsWatch(apiToken, body);

  const bffMissing =
    result.httpStatus === 404 || result.error === 'endpoint_not_found';
  if (!result.ok && bffMissing) {
    result = await postKidsWatchCrm(apiToken, body);
  }

  if (!result.ok) {
    throw new Error(result.error ?? 'request_failed');
  }
  return { ok: true, id: result.id };
}
