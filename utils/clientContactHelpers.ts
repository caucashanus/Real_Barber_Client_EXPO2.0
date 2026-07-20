import type { CrmClient } from '@/api/auth';

export function isClientContactComplete(client: CrmClient | null | undefined): boolean {
  if (!client) return false;
  return Boolean(client.name?.trim() && client.email?.trim() && client.phone?.trim());
}
