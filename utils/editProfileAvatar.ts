import type { UpdateClientMeBody } from '@/api/client';

/** Má uživatel na serveru uloženou fotku, kterou lze smazat? */
export function hasServerProfileAvatar(avatarUrl: string | null | undefined): boolean {
  return Boolean(avatarUrl?.trim());
}

/**
 * PATCH /me — avatar jen při změně:
 * - nová fotka → URL z uploadu
 * - odstranění → null
 * - jinak pole neposílat (avatar se nemění)
 */
export function buildEditProfileAvatarPatch(options: {
  uploadedAvatarUrl?: string;
  avatarRemoved: boolean;
}): Pick<UpdateClientMeBody, 'avatar'> {
  if (options.uploadedAvatarUrl) {
    return { avatar: options.uploadedAvatarUrl };
  }
  if (options.avatarRemoved) {
    return { avatar: null };
  }
  return {};
}
