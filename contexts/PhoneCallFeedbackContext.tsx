import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import PhoneCallFeedbackSheetContent from '@/components/phoneCallFeedback/PhoneCallFeedbackSheetContent';
import type { PhoneCallFeedbackReasonKey } from '@/constants/phoneCallFeedbackReasons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { postPhoneCallFeedback } from '@/lib/phoneCallFeedback/post';
import { registerPhoneCallFeedbackScheduler } from '@/lib/phoneCallFeedback/schedule';
import { phoneCallFeedbackUserAgent } from '@/lib/phoneCallFeedback/userAgent';

const OPEN_DELAY_MS = 3000;

function authClientDisplayName(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  return trimmed || null;
}

export function PhoneCallFeedbackProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { apiToken, client } = useAuth();

  const sheetRef = useRef<ActionSheetRef>(null);
  const pendingRef = useRef(false);
  const openedRef = useRef(false);
  const submittedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ratingRef = useRef(0);

  const [rating, setRating] = useState(0);
  const [reasons, setReasons] = useState<Set<PhoneCallFeedbackReasonKey>>(() => new Set());

  ratingRef.current = rating;

  const resetSheetState = useCallback(() => {
    submittedRef.current = false;
    setRating(0);
    setReasons(new Set());
  }, []);

  const buildPayload = useCallback(
    (nextRating: number | null, nextReasons: PhoneCallFeedbackReasonKey[]) => ({
      rating: nextRating,
      reasons: nextReasons,
      source: 'app' as const,
      isLoggedIn: Boolean(apiToken),
      clientName: apiToken ? authClientDisplayName(client?.name) : null,
      phone: apiToken ? client?.phone?.trim() || null : null,
      locale,
      userAgent: phoneCallFeedbackUserAgent(),
    }),
    [apiToken, client?.name, client?.phone, locale]
  );

  const sendFeedback = useCallback(
    (nextRating: number | null, nextReasons: PhoneCallFeedbackReasonKey[]) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      void postPhoneCallFeedback(buildPayload(nextRating, nextReasons));
    },
    [buildPayload]
  );

  const hideSheet = useCallback(() => {
    sheetRef.current?.hide();
  }, []);

  const openFeedbackSheet = useCallback(() => {
    if (openedRef.current || Platform.OS === 'web') return;
    openedRef.current = true;
    pendingRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    resetSheetState();
    sheetRef.current?.show();
  }, [resetSheetState]);

  const scheduleAfterOperatorCall = useCallback(() => {
    if (Platform.OS === 'web') return;
    pendingRef.current = true;
    openedRef.current = false;

    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      if (pendingRef.current && !openedRef.current) {
        openFeedbackSheet();
      }
    }, OPEN_DELAY_MS);
  }, [openFeedbackSheet]);

  useEffect(() => {
    registerPhoneCallFeedbackScheduler(scheduleAfterOperatorCall);
    return () => registerPhoneCallFeedbackScheduler(null);
  }, [scheduleAfterOperatorCall]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && pendingRef.current && !openedRef.current) {
        openFeedbackSheet();
      }
    });
    return () => subscription.remove();
  }, [openFeedbackSheet]);

  const handleSheetClose = useCallback(() => {
    if (submittedRef.current) {
      resetSheetState();
      return;
    }

    const currentRating = ratingRef.current;
    if (currentRating === 0) {
      sendFeedback(null, []);
    }

    resetSheetState();
  }, [resetSheetState, sendFeedback]);

  const handleRatingChange = useCallback(
    (nextRating: number) => {
      if (nextRating === 5) {
        sendFeedback(5, []);
        hideSheet();
        return;
      }
      setRating(nextRating);
      if (nextRating === 0) {
        setReasons(new Set());
      }
    },
    [hideSheet, sendFeedback]
  );

  const toggleReason = useCallback((key: PhoneCallFeedbackReasonKey) => {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSubmitLowRating = useCallback(() => {
    if (rating < 1 || rating > 4) return;
    sendFeedback(rating, [...reasons]);
    hideSheet();
  }, [hideSheet, rating, reasons, sendFeedback]);

  return (
    <>
      {children}
      <ActionSheetThemed ref={sheetRef} gestureEnabled onClose={handleSheetClose}>
        <PhoneCallFeedbackSheetContent
          t={t}
          rating={rating}
          reasons={reasons}
          onRatingChange={handleRatingChange}
          onToggleReason={toggleReason}
          onSubmitLowRating={handleSubmitLowRating}
        />
      </ActionSheetThemed>
    </>
  );
}
