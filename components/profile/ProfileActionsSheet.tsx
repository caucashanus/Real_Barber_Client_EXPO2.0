import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import Icon from '@/components/Icon';
import SheetNavRow from '@/components/shared/SheetNavRow';
import ThemedText from '@/components/ThemedText';

export interface ProfileActionsSheetProps {
  title: string;
  bookLabel: string;
  /** Render inside another action sheet (non-modal overlay above parent). */
  nested?: boolean;
  onShare: () => void;
  onRate: () => void;
  onBook: () => void;
}

const NESTED_SHEET_Z_INDEX = 10000;
const ACTIONS_SHEET_ELEVATION = 24;

export const ProfileActionsSheet = forwardRef<ActionSheetRef, ProfileActionsSheetProps>(
  function ProfileActionsSheet({ title, bookLabel, nested = false, onShare, onRate, onBook }, ref) {
    const { t } = useTranslation();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    return (
      <ActionSheetThemed
        ref={setRef}
        gestureEnabled
        isModal={!nested}
        zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}
        elevation={nested ? ACTIONS_SHEET_ELEVATION : undefined}
        defaultOverlayOpacity={nested ? 0.45 : undefined}>
        <View className="gap-1 px-4 pb-8 pt-2">
          <ThemedText className="mb-2 text-base font-semibold leading-6">{title}</ThemedText>

          <SheetNavRow
            label={t('barberMenuShare')}
            icon={<Icon name="Share2" size={16} strokeWidth={1.5} className="opacity-80" />}
            onPress={onShare}
          />
          <SheetNavRow
            label={t('barberMenuRate')}
            icon={
              <ThemedText className="w-4 text-center text-base text-amber-300/90">★</ThemedText>
            }
            onPress={onRate}
          />
          <SheetNavRow
            label={bookLabel}
            icon={<Icon name="Calendar" size={16} strokeWidth={1.5} className="opacity-80" />}
            onPress={onBook}
          />
        </View>
      </ActionSheetThemed>
    );
  }
);
