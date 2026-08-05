import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Clipboard } from 'react-native';

import { useTranslation } from '@/hooks/useTranslation';
import CopyFeedback from '@/components/CopyFeedback';

type CopyFeedbackContextType = {
  copyToClipboard: (text: string, message?: string) => void;
};

const CopyFeedbackContext = createContext<CopyFeedbackContextType | null>(null);

export function CopyFeedbackProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const feedbackKeyRef = useRef(0);
  const [feedback, setFeedback] = useState<{
    key: number;
    message: string;
    visible: boolean;
  }>({
    key: 0,
    message: '',
    visible: false,
  });

  const hideFeedback = useCallback(() => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  }, []);

  const copyToClipboard = useCallback(
    (text: string, message?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      Clipboard.setString(trimmed);
      feedbackKeyRef.current += 1;
      setFeedback({
        key: feedbackKeyRef.current,
        message: message ?? t('clipboardCopied'),
        visible: true,
      });
    },
    [t]
  );

  const value = useMemo(() => ({ copyToClipboard }), [copyToClipboard]);

  return (
    <CopyFeedbackContext.Provider value={value}>
      {children}
      <CopyFeedback
        key={feedback.key}
        isVisible={feedback.visible}
        message={feedback.message}
        onHide={hideFeedback}
      />
    </CopyFeedbackContext.Provider>
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
