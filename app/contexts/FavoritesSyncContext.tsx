import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type FavoritesSyncContextType = {
  favoritesVersion: number;
  notifyFavoritesChanged: () => void;
};

const FavoritesSyncContext = createContext<FavoritesSyncContextType | null>(null);

export function FavoritesSyncProvider({ children }: { children: React.ReactNode }) {
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  const notifyFavoritesChanged = useCallback(() => {
    setFavoritesVersion((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({ favoritesVersion, notifyFavoritesChanged }),
    [favoritesVersion, notifyFavoritesChanged]
  );

  return <FavoritesSyncContext.Provider value={value}>{children}</FavoritesSyncContext.Provider>;
}

export function useFavoritesSync(): FavoritesSyncContextType {
  const ctx = useContext(FavoritesSyncContext);
  if (!ctx) {
    return {
      favoritesVersion: 0,
      notifyFavoritesChanged: () => {},
    };
  }
  return ctx;
}
