import type { CrmClient } from '@/api/auth';
import { getClientMe } from '@/api/client';
import { clientMeToCrm } from '@/utils/signupHelpers';

/** Načte /me z CRM a zapíše do AuthContext (+ AsyncStorage) — stejná data jako po přihlášení. */
export async function syncAuthClientFromApi(params: {
  apiToken: string;
  token: string;
  currentClient: CrmClient;
  setAuth: (token: string, apiToken: string, client: CrmClient) => Promise<void>;
}): Promise<void> {
  const me = await getClientMe(params.apiToken);
  const fresh = clientMeToCrm(me);
  await params.setAuth(params.token, params.apiToken, {
    ...params.currentClient,
    ...fresh,
  });
}
