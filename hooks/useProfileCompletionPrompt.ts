import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import type { ActionSheetRef } from 'react-native-actions-sheet';

import type { ClientMe } from '@/api/client';
import {
  pickProfileCompletionStep,
  type ProfileCompletionStepId,
} from '@/constants/profileCompletionSchema';
import {
  canShowProfileCompletionPrompt,
  isProfileCompletionStepDismissed,
  PROFILE_COMPLETION_SHEET_ENABLED,
  recordProfileCompletionPromptShown,
} from '@/utils/profileCompletionPolicy';

interface UseProfileCompletionPromptOptions {
  client: ClientMe | null;
  loading: boolean;
  sheetRef: React.RefObject<ActionSheetRef | null>;
  onStepChange: (step: ProfileCompletionStepId | null) => void;
}

/** Po focus profilu občas nabídne doplnění prvního chybějícího kroku (email → birthday → avatar → address). */
export function useProfileCompletionPrompt({
  client,
  loading,
  sheetRef,
  onStepChange,
}: UseProfileCompletionPromptOptions) {
  const didAttemptThisFocusRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      didAttemptThisFocusRef.current = false;

      return () => {
        didAttemptThisFocusRef.current = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (didAttemptThisFocusRef.current) return;
      if (!PROFILE_COMPLETION_SHEET_ENABLED) return;
      if (loading || !client) return;

      void (async () => {
        const step = pickProfileCompletionStep(client);
        if (!step) {
          didAttemptThisFocusRef.current = true;
          return;
        }

        const [allowed, dismissed] = await Promise.all([
          canShowProfileCompletionPrompt(),
          isProfileCompletionStepDismissed(step),
        ]);

        didAttemptThisFocusRef.current = true;

        if (!allowed || dismissed) return;

        onStepChange(step);
        await recordProfileCompletionPromptShown();

        setTimeout(() => {
          sheetRef.current?.show();
        }, 900);
      })();
    }, [client, loading, onStepChange, sheetRef])
  );
}
