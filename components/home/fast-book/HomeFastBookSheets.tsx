import React, { useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import HomeFastBookServicesPanel from '@/components/home/fast-book/HomeFastBookServicesPanel';
import HomeFastBookWhenPanel from '@/components/home/fast-book/HomeFastBookWhenPanel';
import {
  HOME_FAST_BOOK_OVERLAY,
  homeFastBookWhenPanelBg,
} from '@/components/home/fast-book/homeFastBookSheetUi';
import {
  ActionSheetNestedDock,
  ActionSheetStackScrim,
  actionSheetNestedStackStyles as styles,
} from '@/components/shared/sheet/ActionSheetNestedDock';
import type { Booking } from '@/api/bookings';
import useThemeColors from '@/contexts/ThemeColors';
import type { Locale } from '@/contexts/LanguageContext';
import { useActionSheetVisible } from '@/hooks/useActionSheetVisible';
import type { HomeFastBookFlow } from '@/hooks/useHomeFastBookFlow';
import type { TranslationKey } from '@/locales';

type SheetProps = {
  flow: HomeFastBookFlow;
  t: (key: TranslationKey) => string;
};

/** Homepage „Později“ — samostatný when sheet. */
export function HomeFastBookWhenSheet({ flow, t }: SheetProps) {
  const colors = useThemeColors();
  const open = flow.whenOpen && !flow.servicesOpen;
  const ref = useActionSheetVisible(open);

  return (
    <ActionSheetThemed
      ref={ref}
      fitContent
      gestureEnabled
      headerAlwaysVisible
      closeOnTouchBackdrop
      closeOnPressBack
      defaultOverlayOpacity={HOME_FAST_BOOK_OVERLAY.whenOpen}
      onClose={() => flow.onWhenOpenChange(false)}
      containerStyle={{
        backgroundColor: homeFastBookWhenPanelBg(colors.isDark),
        maxHeight: '80%',
      }}>
      <HomeFastBookWhenPanel
        t={t}
        choice={flow.whenChoice}
        onChoiceChange={flow.setWhenChoice}
        onConfirm={flow.confirmWhen}
      />
    </ActionSheetThemed>
  );
}

type ServicesSheetProps = SheetProps & {
  locale: Locale;
  bookings: Booking[] | null | undefined;
  bookingsLoading?: boolean;
};

function ServicesWhenStack({
  whenDocked,
  dismissWhen,
  flow,
  locale,
  bookings,
  bookingsLoading,
  t,
}: ServicesSheetProps & { whenDocked: boolean; dismissWhen: () => void }) {
  const colors = useThemeColors();
  const servicesHeightRef = useRef<number | null>(null);

  const onStackLayout = (event: LayoutChangeEvent) => {
    const height = Math.ceil(event.nativeEvent.layout.height);
    if (!whenDocked) {
      servicesHeightRef.current = height;
      return;
    }
    if (servicesHeightRef.current == null) {
      servicesHeightRef.current = height;
    }
  };

  const stackHeight =
    whenDocked && servicesHeightRef.current != null ? servicesHeightRef.current : undefined;

  return (
    <View
      style={[styles.stack, stackHeight != null ? { height: stackHeight } : null]}
      onLayout={onStackLayout}>
      <View style={styles.baseLayer} pointerEvents={whenDocked ? 'none' : 'auto'}>
        <HomeFastBookServicesPanel
          flow={flow}
          locale={locale}
          t={t}
          bookings={bookings}
          bookingsLoading={bookingsLoading}
        />
      </View>

      {whenDocked ? (
        <>
          <ActionSheetStackScrim onDismiss={dismissWhen} />
          <ActionSheetNestedDock
            panelBackgroundColor={homeFastBookWhenPanelBg(colors.isDark)}
            onDismiss={dismissWhen}>
            <HomeFastBookWhenPanel
              t={t}
              choice={flow.whenChoice}
              onChoiceChange={flow.setWhenChoice}
              onConfirm={flow.confirmWhen}
            />
          </ActionSheetNestedDock>
        </>
      ) : null}
    </View>
  );
}

/** „Naplánuj si termín“ — při when: zamčená výška, scrim nad službami, when dole. */
export function HomeFastBookServicesSheet({
  flow,
  locale,
  bookings,
  bookingsLoading,
  t,
}: ServicesSheetProps) {
  const ref = useActionSheetVisible(flow.servicesOpen);
  const whenDocked = flow.whenOpen && flow.servicesOpen;
  const dismissWhen = () => flow.onWhenOpenChange(false);

  if (!flow.servicesOpen) return null;

  return (
    <ActionSheetThemed
      ref={ref}
      gestureEnabled={!flow.whenOpen}
      closeOnTouchBackdrop={!flow.whenOpen}
      closeOnPressBack={!flow.whenOpen}
      defaultOverlayOpacity={
        flow.whenOpen ? HOME_FAST_BOOK_OVERLAY.whenOpen : HOME_FAST_BOOK_OVERLAY.base
      }
      onTouchBackdrop={() => {
        if (whenDocked) dismissWhen();
      }}
      onClose={() => flow.onServicesOpenChange(false)}>
      <ServicesWhenStack
        flow={flow}
        locale={locale}
        bookings={bookings}
        bookingsLoading={bookingsLoading}
        t={t}
        whenDocked={whenDocked}
        dismissWhen={dismissWhen}
      />
    </ActionSheetThemed>
  );
}
