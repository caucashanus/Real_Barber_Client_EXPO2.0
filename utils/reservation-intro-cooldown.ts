import { isCooldownActive, setCooldownMs } from './cooldown';

const STORAGE_KEY = '@reservation_intro_suppress_until';
const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

/** Po zobrazení úvodu „rezervace je snadná“ nebo kliknutí na Začít / Jdeme na to – 24 h se skryje úvodní stránka. */
export async function setReservationIntroCooldown24h(): Promise<void> {
  await setCooldownMs(STORAGE_KEY, TWENTY_FOUR_H_MS);
}

export async function isReservationIntroCooldownActive(): Promise<boolean> {
  return isCooldownActive(STORAGE_KEY);
}
