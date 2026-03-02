import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ClientProductPurchase } from '@/api/products';

type SelectedPurchaseContextValue = {
  selectedPurchase: ClientProductPurchase | null;
  setSelectedPurchase: (p: ClientProductPurchase | null) => void;
};

const SelectedPurchaseContext = createContext<SelectedPurchaseContextValue | null>(null);

export function SelectedPurchaseProvider({ children }: { children: React.ReactNode }) {
  const [selectedPurchase, setSelectedPurchase] = useState<ClientProductPurchase | null>(null);
  const set = useCallback((p: ClientProductPurchase | null) => {
    setSelectedPurchase(p);
  }, []);
  return (
    <SelectedPurchaseContext.Provider value={{ selectedPurchase, setSelectedPurchase: set }}>
      {children}
    </SelectedPurchaseContext.Provider>
  );
}

export function useSelectedPurchase() {
  const ctx = useContext(SelectedPurchaseContext);
  return ctx?.selectedPurchase ?? null;
}

export function useSetSelectedPurchase() {
  const ctx = useContext(SelectedPurchaseContext);
  return ctx?.setSelectedPurchase ?? (() => {});
}
