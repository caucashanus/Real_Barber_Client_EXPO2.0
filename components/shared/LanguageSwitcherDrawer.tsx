import React, { forwardRef, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import Section from '@/components/layout/Section';
import LanguageSwitcherRow from '@/components/shared/LanguageSwitcherRow';
import { APP_LOCALE_ITEMS } from '@/constants/appLanguage';
import { useLanguage, type Locale } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

/** Mobilní sheet pro výběr jazyka (web LanguageSwitcherDrawer). */
export const LanguageSwitcherDrawer = forwardRef<ActionSheetRef>(
  function LanguageSwitcherDrawer(_props, ref) {
    const { t } = useTranslation();
    const { locale, setLocale } = useLanguage();
    const innerRef = useRef<ActionSheetRef | null>(null);

    const setRefs = useCallback(
      (node: ActionSheetRef | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
      },
      [ref]
    );

    const hideSheet = () => {
      innerRef.current?.hide();
    };

    const handleSelect = (next: Locale) => {
      if (next !== locale) setLocale(next);
      hideSheet();
    };

    return (
      <ActionSheetThemed ref={setRefs} gestureEnabled>
        <View className="px-4 pb-8 pt-2">
          <Section title={t('localeSelectTitle')} titleSize="lg" padding="none" className="mb-2">
            <View className="gap-1">
              {APP_LOCALE_ITEMS.map((item) => (
                <LanguageSwitcherRow
                  key={item.locale}
                  item={item}
                  selected={locale === item.locale}
                  onPress={() => handleSelect(item.locale)}
                />
              ))}
            </View>
          </Section>
        </View>
      </ActionSheetThemed>
    );
  }
);
