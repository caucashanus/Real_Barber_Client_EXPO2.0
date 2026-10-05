import type { CrmClient } from '@/api/auth';
import { LOGIN_COMPLETE_EMAIL_PATH } from '@/constants/authRoutes';
import { isClientMissingRequiredEmail } from '@/utils/signupHelpers';

export const POST_LOGIN_HOME_PATH = '/(tabs)/(home)' as const;

export function resolvePostLoginHref(client: CrmClient): string {
  return isClientMissingRequiredEmail(client)
    ? LOGIN_COMPLETE_EMAIL_PATH
    : POST_LOGIN_HOME_PATH;
}
