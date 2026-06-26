import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getBookings, type Booking } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import { isBookingUpcoming } from '@/utils/bookingHelpers';
import { shouldStaleRefresh } from '@/utils/staleRefresh';

const BOOKINGS_STALE_MS = 60_000;

type BookingsContextType = {
  bookings: Booking[];
  loading: boolean;
  hasUpcomingBookings: boolean;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  refreshIfStale: () => void;
};

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export function BookingsBadgeProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedAtRef = useRef(0);
  const inflightRef = useRef<Promise<void> | null>(null);

  const hasUpcomingBookings = useMemo(
    () => bookings.some(isBookingUpcoming),
    [bookings]
  );

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!apiToken) {
      setBookings([]);
      lastFetchedAtRef.current = 0;
      return;
    }

    const isStale = shouldStaleRefresh(lastFetchedAtRef.current, {
      force: options?.force,
      staleMs: BOOKINGS_STALE_MS,
    });
    if (!isStale) return;

    if (inflightRef.current) return inflightRef.current;

    setLoading(true);
    inflightRef.current = (async () => {
      try {
        const res = await getBookings(apiToken);
        setBookings(res.bookings);
        lastFetchedAtRef.current = Date.now();
      } catch {
        if (options?.force && lastFetchedAtRef.current === 0) setBookings([]);
      } finally {
        setLoading(false);
        inflightRef.current = null;
      }
    })();

    return inflightRef.current;
  }, [apiToken]);

  const refreshIfStale = useCallback(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh({ force: true });
  }, [refresh]);

  return (
    <BookingsContext.Provider
      value={{ bookings, loading, hasUpcomingBookings, refresh, refreshIfStale }}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsBadgeProvider');
  return ctx;
}

export function useBookingsBadge() {
  const { hasUpcomingBookings, refresh, refreshIfStale } = useBookings();
  return { hasUpcomingBookings, refresh, refreshIfStale };
}
