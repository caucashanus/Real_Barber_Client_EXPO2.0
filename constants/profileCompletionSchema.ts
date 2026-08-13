import type { ClientMe } from '@/api/client';
import type { TranslationKey } from '@/locales';

export type ProfileCompletionStepId = 'email' | 'birthday' | 'avatar' | 'address';

export const PROFILE_COMPLETION_STEPS: readonly ProfileCompletionStepId[] = [
  'email',
  'birthday',
  'avatar',
  'address',
] as const;

export type ProfileCompletionStepConfig = {
  id: ProfileCompletionStepId;
  focusKey: ProfileCompletionStepId;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  isComplete: (client: ClientMe) => boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasCustomAvatar(client: ClientMe): boolean {
  const raw = client.avatarUrl?.trim() ?? '';
  if (!raw) return false;
  return raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('file:');
}

function hasBirthday(client: ClientMe): boolean {
  const raw = client.birthday?.trim() ?? '';
  if (!raw) return false;
  const time = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`).getTime();
  return Number.isFinite(time);
}

export const PROFILE_COMPLETION_STEP_CONFIG: Record<
  ProfileCompletionStepId,
  ProfileCompletionStepConfig
> = {
  email: {
    id: 'email',
    focusKey: 'email',
    titleKey: 'profileCompletionEmailTitle',
    bodyKey: 'profileCompletionEmailBody',
    isComplete: (client) => EMAIL_PATTERN.test(client.email?.trim() ?? ''),
  },
  birthday: {
    id: 'birthday',
    focusKey: 'birthday',
    titleKey: 'profileCompletionBirthdayTitle',
    bodyKey: 'profileCompletionBirthdayBody',
    isComplete: hasBirthday,
  },
  avatar: {
    id: 'avatar',
    focusKey: 'avatar',
    titleKey: 'profileCompletionAvatarTitle',
    bodyKey: 'profileCompletionAvatarBody',
    isComplete: hasCustomAvatar,
  },
  address: {
    id: 'address',
    focusKey: 'address',
    titleKey: 'profileCompletionAddressTitle',
    bodyKey: 'profileCompletionAddressBody',
    isComplete: (client) =>
      Boolean(client.address?.trim()) && Boolean(client.city?.trim()),
  },
};

export function pickProfileCompletionStep(client: ClientMe): ProfileCompletionStepId | null {
  for (const stepId of PROFILE_COMPLETION_STEPS) {
    if (!PROFILE_COMPLETION_STEP_CONFIG[stepId].isComplete(client)) {
      return stepId;
    }
  }
  return null;
}

export function editProfileHrefForStep(stepId: ProfileCompletionStepId): string {
  return `/screens/edit-profile?focus=${encodeURIComponent(stepId)}`;
}
