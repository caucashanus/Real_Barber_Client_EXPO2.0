import React, { forwardRef, useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import Input from '@/components/forms/Input';
import ThemedText from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

export const ProfileContactFormSheet = forwardRef<ActionSheetRef>(function ProfileContactFormSheet(
  _props,
  ref
) {
  const { t } = useTranslation();
  const { client } = useAuth();
  const innerRef = useRef<ActionSheetRef | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const setRefs = useCallback(
    (node: ActionSheetRef | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref != null) (ref as React.MutableRefObject<ActionSheetRef | null>).current = node;
    },
    [ref]
  );

  const handleOpen = useCallback(() => {
    const displayName = client?.name?.trim() || '';
    const clientEmail = client?.email?.trim() || '';
    setName(displayName);
    setEmail(clientEmail);
    setMessage('');
  }, [client?.email, client?.name]);

  return (
    <ActionSheetThemed ref={setRefs} gestureEnabled onOpen={handleOpen}>
      <View className="gap-4 px-4 pb-8 pt-2">
        <ThemedText className="text-base font-semibold">{t('profileContactFormTitle')}</ThemedText>

        <ThemedText className="text-sm leading-5 text-light-subtext dark:text-dark-subtext">
          {t('profileContactFormHint')}
        </ThemedText>

        <Input
          label={t('profileContactFormName')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          variant="classic"
        />
        <Input
          label={t('profileContactFormEmail')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          variant="classic"
        />
        <Input
          label={t('profileContactFormMessage')}
          value={message}
          onChangeText={setMessage}
          isMultiline
          variant="classic"
        />

        <AppButton title={t('profileContactFormSubmit')} fullWidth disabled />
      </View>
    </ActionSheetThemed>
  );
});
