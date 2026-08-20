import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Clipboard } from 'react-native';

import CopyFeedbackToastContent from '@/components/animated-toast/CopyFeedbackToastContent';
import { ToastProvider, useToast } from '@/components/animated-toast';
import { ToastViewport } from '@/components/animated-toast/Viewport';
import { useTranslation } from '@/hooks/useTranslation';

const COPY_TOAST_DURATION_MS = 1800;

type CopyFeedbackContextType = {
  copyToClipboard: (text: string, message?: string) => void;
};

const CopyFeedbackContext = createContext<CopyFeedbackContextType | null>(null);

function CopyFeedbackBridge({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { show, dismissAll } = useToast();

  const copyToClipboard = useCallback(
    (text: string, message?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      Clipboard.setString(trimmed);

      dismissAll();
      show(<CopyFeedbackToastContent message={message ?? t('clipboardCopied')} />, {
        position: 'top',
        duration: COPY_TOAST_DURATION_MS,
        type: 'default',
      });
    },
    [dismissAll, show, t]
  );

  const value = useMemo(() => ({ copyToClipboard }), [copyToClipboard]);

  return <CopyFeedbackContext.Provider value={value}>{children}</CopyFeedbackContext.Provider>;
}

export function CopyFeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CopyFeedbackBridge>
        {children}
        <ToastViewport />
      </CopyFeedbackBridge>
    </ToastProvider>
  );
}

export function useCopyFeedback(): CopyFeedbackContextType {
  const ctx = useContext(CopyFeedbackContext);
  if (!ctx) {
    return {
      copyToClipboard: (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        Clipboard.setString(trimmed);
      },
    };
  }
  return ctx;
}
