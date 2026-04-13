import React, { createContext, useContext, useState, useCallback } from 'react';

import type { ClientCatalogProduct, ClientProductPurchase } from '@/api/products';

type SelectedPurchaseContextValue = {
  selectedPurchase: ClientProductPurchase | null;
  setSelectedPurchase: (p: ClientProductPurchase | null) => void;
  selectedCatalogProduct: ClientCatalogProduct | null;
  setSelectedCatalogProduct: (p: ClientCatalogProduct | null) => void;
};

const SelectedPurchaseContext = createContext<SelectedPurchaseContextValue | null>(null);

export function SelectedPurchaseProvider({ children }: { children: React.ReactNode }) {
  const [selectedPurchase, setSelectedPurchase] = useState<ClientProductPurchase | null>(null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<ClientCatalogProduct | null>(
    null
  );
  const setPurchase = useCallback((p: ClientProductPurchase | null) => {
    setSelectedPurchase(p);
  }, []);
  const setCatalog = useCallback((p: ClientCatalogProduct | null) => {
    setSelectedCatalogProduct(p);
  }, []);
  return (
    <SelectedPurchaseContext.Provider
      value={{
        selectedPurchase,
        setSelectedPurchase: setPurchase,
        selectedCatalogProduct,
        setSelectedCatalogProduct: setCatalog,
      }}>
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

export function useSelectedCatalogProduct() {
  const ctx = useContext(SelectedPurchaseContext);
  return ctx?.selectedCatalogProduct ?? null;
}

export function useSetSelectedCatalogProduct() {
  const ctx = useContext(SelectedPurchaseContext);
  return ctx?.setSelectedCatalogProduct ?? (() => {});
}
