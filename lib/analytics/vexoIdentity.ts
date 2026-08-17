import type { CrmClient } from '@/api/auth';

/**
 * Vexo `identifyDevice` accepts a single string — combine email + phone when both exist.
 * Fallback order: email|phone → email → phone → CRM id.
 */
export function getVexoDeviceId(client: CrmClient): string {
  const email = client.email?.trim();
  const phone = client.phone?.trim();

  if (email && phone) return `${email}|${phone}`;
  if (email) return email;
  if (phone) return phone;
  return client.id;
}
