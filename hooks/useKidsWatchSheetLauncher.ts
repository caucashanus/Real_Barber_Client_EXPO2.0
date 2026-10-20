import { useCallback, useState } from 'react';

/** Lokální stav pro `HomeKidsWatchSheet` — promo z home nebo přeskočení na wizard z detailu rezervace. */
export type KidsWatchBookingEntry = 'promo' | 'wizard';

export function useKidsWatchSheetLauncher() {
  const [open, setOpen] = useState(false);
  const [initialBookingId, setInitialBookingId] = useState<string | null>(null);
  const [initialBookingEntry, setInitialBookingEntry] =
    useState<KidsWatchBookingEntry>('wizard');

  const openFromHome = useCallback(() => {
    setInitialBookingId(null);
    setInitialBookingEntry('promo');
    setOpen(true);
  }, []);

  const openKidsWatchFromBooking = useCallback(
    (bookingId: string, entry: KidsWatchBookingEntry = 'wizard') => {
      setInitialBookingId(bookingId);
      setInitialBookingEntry(entry);
      setOpen(true);
    },
    []
  );

  const close = useCallback(() => {
    setOpen(false);
    setInitialBookingId(null);
    setInitialBookingEntry('wizard');
  }, []);

  return {
    open,
    setOpen,
    initialBookingId,
    initialBookingEntry,
    openFromHome,
    openKidsWatchFromBooking,
    close,
  };
}
