import { CrmHttpError, fetchCrm } from '@/api/http';

import type { KidsWatchSubmitBody, KidsWatchSubmitResponse } from '@/api/kids-watch';

import type { PostKidsWatchResult } from './postKidsWatch';

/** Záloha, dokud není nasazen web BFF `/api/kids-watch/`. */
export async function postKidsWatchCrm(
  apiToken: string,
  body: KidsWatchSubmitBody
): Promise<PostKidsWatchResult> {
  try {
    const data = await fetchCrm<KidsWatchSubmitResponse>('/api/kids-watch', {
      apiToken,
      method: 'POST',
      body: { ...body, source: 'app' },
    });
    if (data?.ok === false) {
      return { ok: false, error: 'request_failed' };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    if (err instanceof CrmHttpError) {
      return { ok: false, error: err.message, httpStatus: err.status };
    }
    return { ok: false, error: 'network' };
  }
}
