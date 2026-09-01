import { forwardRef, useCallback, useRef, type MutableRefObject } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import BranchOpenStatusRow from '@/components/branch/BranchOpenStatusRow';
import OperatorContactChannels from '@/components/OperatorContactChannels';
import ExpoBottomSheet from '@/components/sheets/ExpoBottomSheet';
import SheetContent from '@/components/sheets/SheetContent';
import { SHEET_TITLE_CLASS } from '@/components/sheets/expoSheetTheme';
import SupportOpenStatusRow from '@/components/support/SupportOpenStatusRow';
import ThemedText from '@/components/ThemedText';

export type OperatorSupportSheetVariant = 'support' | 'callUs';

const NESTED_SHEET_Z_INDEX = 10000;
const CALL_US_SHEET_ELEVATION = 24;

const SUPPORT_SHEET_BODY_CLASS =
  'gap-3 bg-light-primary px-4 pb-8 pt-2 dark:bg-dark-primary';

export interface OperatorSupportSheetProps {
  /**
   * `support` — Rbíček / Nápověda (stav podpory + kanály, Expo bottom sheet).
   * `callUs` — „Zavolejte nám“ (detail holiče / pobočky / nearest).
   */
  variant?: OperatorSupportSheetVariant;
  /** Render inside another action sheet (non-modal overlay above parent). Jen `callUs`. */
  nested?: boolean;
  /** Status badge nad kontakty (standalone); v nearest draweru vypnuto. */
  showBranchOpenStatus?: boolean;
}

function OperatorSupportSheetBody({
  variant,
  showBranchOpenStatus,
  onHide,
}: {
  variant: OperatorSupportSheetVariant;
  showBranchOpenStatus: boolean;
  onHide: () => void;
}) {
  const { t } = useTranslation();
  const isCallUs = variant === 'callUs';
  const title = isCallUs ? t('operatorCallUsTitle') : t('operatorSheetTitle');

  return (
    <>
      <ThemedText className={isCallUs ? 'mb-2 text-base font-semibold leading-6' : SHEET_TITLE_CLASS}>
        {title}
      </ThemedText>

      {variant === 'support' ? (
        <View className="mb-1">
          <SupportOpenStatusRow t={t} />
        </View>
      ) : null}

      {isCallUs && showBranchOpenStatus ? (
        <View className="mb-1">
          <BranchOpenStatusRow t={t} />
        </View>
      ) : null}

      <OperatorContactChannels onBeforeOpen={onHide} />
    </>
  );
}

export const OperatorSupportSheet = forwardRef<ActionSheetRef, OperatorSupportSheetProps>(
  function OperatorSupportSheet(
    { variant = 'support', nested = false, showBranchOpenStatus = false },
    ref
  ) {
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRef = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const isCallUs = variant === 'callUs';

    if (!isCallUs) {
      return (
        <ExpoBottomSheet ref={setRef}>
          <SheetContent className={SUPPORT_SHEET_BODY_CLASS}>
            <OperatorSupportSheetBody
              variant={variant}
              showBranchOpenStatus={showBranchOpenStatus}
              onHide={hideSheet}
            />
          </SheetContent>
        </ExpoBottomSheet>
      );
    }

    return (
      <ActionSheetThemed
        ref={setRef}
        fitContent
        gestureEnabled
        isModal={!nested}
        zIndex={nested ? NESTED_SHEET_Z_INDEX : undefined}
        elevation={nested ? CALL_US_SHEET_ELEVATION : undefined}
        defaultOverlayOpacity={nested ? 0.45 : undefined}>
        <View className="gap-1 px-4 pb-8 pt-2">
          <OperatorSupportSheetBody
            variant={variant}
            showBranchOpenStatus={showBranchOpenStatus}
            onHide={hideSheet}
          />
        </View>
      </ActionSheetThemed>
    );
  }
);

/** Alias pro nested „Zavolejte nám“ sheet (detail holiče / pobočky / nearest). */
export const OperatorCallUsSheet = forwardRef<
  ActionSheetRef,
  { nested?: boolean; showBranchOpenStatus?: boolean }
>(function OperatorCallUsSheet({ nested, showBranchOpenStatus }, ref) {
  return (
    <OperatorSupportSheet
      ref={ref}
      variant="callUs"
      nested={nested}
      showBranchOpenStatus={showBranchOpenStatus}
    />
  );
});
