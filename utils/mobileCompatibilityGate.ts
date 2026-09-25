import type { MobileCompatibilityPolicy } from '@/api/mobileCompatibility';
import { getStoreUpdateUrl } from '@/constants/appVersionPolicy';
import { isAppVersionAtLeast } from '@/utils/compareAppVersions';

export function shouldBlockNativeAppForPolicy(params: {
  installedVersion: string;
  platform: 'ios' | 'android';
  policy: MobileCompatibilityPolicy;
}): boolean {
  const minimum = params.policy.minNativeVersion[params.platform]?.trim();
  if (!minimum) return false;
  return !isAppVersionAtLeast(params.installedVersion, minimum);
}

export function storeUpdateUrlForPlatform(
  platform: 'ios' | 'android',
  policy: MobileCompatibilityPolicy | null | undefined
): string {
  const fromPolicy = policy?.storeUrls[platform]?.trim();
  if (fromPolicy) return fromPolicy;
  return getStoreUpdateUrl(platform);
}
