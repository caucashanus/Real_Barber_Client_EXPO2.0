/**
 * Programové otevření Kids Watch pro konkrétní rezervaci.
 * Vyžaduje mount `HomeKidsWatchSheet` s `registerKidsWatchOpener` (viz home / booking detail).
 */

type Opener = (bookingId: string) => void;

let registeredOpener: Opener | null = null;

export function registerKidsWatchOpener(opener: Opener | null): void {
  registeredOpener = opener;
}

export function openKidsWatchFromBooking(bookingId: string): void {
  if (!registeredOpener) {
    if (__DEV__) {
      console.warn(
        '[KidsWatch] openKidsWatchFromBooking: no sheet mounted — use useKidsWatchSheetLauncher or mount HomeKidsWatchSheet.'
      );
    }
    return;
  }
  registeredOpener(bookingId);
}
