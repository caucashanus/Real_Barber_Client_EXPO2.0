import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { hasUnreadNotifications } from '@/utils/hasUnreadNotifications';

export function useUnreadNotificationBadge(): boolean {
  const { apiToken, client } = useAuth();
  const clientId = client?.id ?? '';
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void (async () => {
        const unread = await hasUnreadNotifications(apiToken ?? '', clientId);
        if (!cancelled) setHasUnread(unread);
      })();

      return () => {
        cancelled = true;
      };
    }, [apiToken, clientId])
  );

  return hasUnread;
}
