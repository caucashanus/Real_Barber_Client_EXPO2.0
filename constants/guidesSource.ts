export type GuidesSource = 'crm_public' | 'bundled' | 'crm_client';

/** Default: public articles (parita s web /navody/). Viz docs/app-navody-crm-offboarding.md */
export function resolveGuidesSource(): GuidesSource {
  const raw = process.env.EXPO_PUBLIC_GUIDES_SOURCE?.trim().toLowerCase();
  if (raw === 'bundled' || raw === 'crm_client' || raw === 'crm_public') {
    return raw;
  }
  return 'crm_public';
}
