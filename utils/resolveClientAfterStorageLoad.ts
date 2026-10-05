import type { CrmClient } from '@/api/auth';
import type { ClientMe } from '@/api/client';
import { isClientMissingRequiredEmail } from '@/utils/signupHelpers';

/**
 * Po načtení session: pokud v cache chybí e-mail, jednou zkusí /me (CRM už může mít e-mail).
 */
export async function resolveClientAfterStorageLoad(params: {
  storedClient: CrmClient;
  apiToken: string;
  fetchClientMe: (apiToken: string) => Promise<ClientMe>;
  clientMeToCrm: (me: ClientMe) => CrmClient;
}): Promise<CrmClient> {
  if (!isClientMissingRequiredEmail(params.storedClient)) {
    return params.storedClient;
  }
  try {
    const me = await params.fetchClientMe(params.apiToken);
    const fromApi = params.clientMeToCrm(me);
    if (!isClientMissingRequiredEmail(fromApi)) {
      return fromApi;
    }
  } catch {
    /* ponechat cache */
  }
  return params.storedClient;
}
