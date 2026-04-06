import { isCooldownActive, setCooldownMs } from './cooldown';

const STORAGE_KEY = '@haircut_intro_suppress_until';
const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

/** Po zobrazení úvodu „účes je snadné“ nebo kliknutí na Začít / Jdeme na to – 24 h se skryje karta a přeskočí úvodní stránka. */
export async function setHaircutIntroCooldown24h(): Promise<void> {
  await setCooldownMs(STORAGE_KEY, TWENTY_FOUR_H_MS);
}

export async function isHaircutIntroCooldownActive(): Promise<boolean> {
  return isCooldownActive(STORAGE_KEY);
}
