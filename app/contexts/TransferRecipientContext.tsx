import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface TransferRecipientPayload {
  id: string;
  name: string;
  type: 'CLIENT' | 'EMPLOYEE';
  avatarUrl?: string;
}

type TransferRecipientContextValue = {
  recipient: TransferRecipientPayload | null;
  recipientRef: React.MutableRefObject<TransferRecipientPayload | null>;
  setTransferRecipient: (r: TransferRecipientPayload | null) => void;
};

const TransferRecipientContext = createContext<TransferRecipientContextValue | null>(null);

export function TransferRecipientProvider({ children }: { children: React.ReactNode }) {
  const [recipient, setRecipient] = useState<TransferRecipientPayload | null>(null);
  const recipientRef = useRef<TransferRecipientPayload | null>(null);
  const setTransferRecipient = useCallback((r: TransferRecipientPayload | null) => {
    recipientRef.current = r;
    setRecipient(r);
  }, []);
  return (
    <TransferRecipientContext.Provider value={{ recipient, recipientRef, setTransferRecipient }}>
      {children}
    </TransferRecipientContext.Provider>
  );
}

export function useTransferRecipient() {
  const ctx = useContext(TransferRecipientContext);
  if (!ctx) return null;
  return ctx.recipientRef.current ?? ctx.recipient;
}

export function useSetTransferRecipient() {
  const ctx = useContext(TransferRecipientContext);
  return ctx?.setTransferRecipient ?? (() => {});
}
