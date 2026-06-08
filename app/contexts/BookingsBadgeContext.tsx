import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getBookings } from '@/api/bookings';
import { useAuth } from '@/app/contexts/AuthContext';
import { isBookingUpcoming } from '@/utils/bookingHelpers';

type BookingsBadgeContextType = {
  hasUpcomingBookings: boolean;
  refresh: () => void;
};

const BookingsBadgeContext = createContext<BookingsBadgeContextType | undefined>(undefined);

export function BookingsBadgeProvider({ children }: { children: React.ReactNode }) {
  const { apiToken } = useAuth();
  const [hasUpcomingBookings, setHasUpcomingBookings] = useState(false);

  const refresh = useCallback(() => {
    if (!apiToken) {
      setHasUpcomingBookings(false);
      return;
    }
    getBookings(apiToken)
      .then((res) => setHasUpcomingBookings(res.bookings.some(isBookingUpcoming)))
      .catch(() => setHasUpcomingBookings(false));
  }, [apiToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BookingsBadgeContext.Provider value={{ hasUpcomingBookings, refresh }}>
      {children}
    </BookingsBadgeContext.Provider>
  );
}

export function useBookingsBadge() {
  const ctx = useContext(BookingsBadgeContext);
  if (!ctx) throw new Error('useBookingsBadge must be used within BookingsBadgeProvider');
  return ctx;
}
