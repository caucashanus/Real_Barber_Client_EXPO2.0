import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

type DetailScreenLayoutContextValue = {
  /** Mimo home tab stack (např. /screens/* z Oblíbených). */
  standalone: boolean;
};

const DetailScreenLayoutContext = createContext<DetailScreenLayoutContextValue>({
  standalone: false,
});

export function DetailScreenLayoutProvider({
  standalone,
  children,
}: {
  standalone: boolean;
  children: React.ReactNode;
}) {
  return (
    <DetailScreenLayoutContext.Provider value={{ standalone }}>
      {children}
    </DetailScreenLayoutContext.Provider>
  );
}

export function useDetailScreenLayout() {
  return useContext(DetailScreenLayoutContext);
}

/** Header s back — na mobilu jen v standalone režimu (home tab má SearchBar). */
export function useDetailTopHeader(): boolean {
  const { width } = useWindowDimensions();
  const { standalone } = useDetailScreenLayout();
  return standalone || width >= 768;
}

export function useDetailScrollContentClassName(): string {
  const { width } = useWindowDimensions();
  const { standalone } = useDetailScreenLayout();
  const isMobile = width < 768;
  if (!isMobile) return 'p-global pb-8';
  if (standalone) return 'px-global pb-8';
  return 'mt-4 px-global pb-8';
}
