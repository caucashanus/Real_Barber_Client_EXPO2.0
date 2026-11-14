import * as NavigationBar from 'expo-navigation-bar';
import React, { useState } from 'react';
import { View, Platform, TextInput } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import useThemeColors from '@/contexts/ThemeColors';
import { useTheme } from '@/contexts/ThemeContext';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import AppButton from '@/components/AppButton';
import { Chip } from '@/components/Chip';
import ThemedText from '@/components/ThemedText';

interface ConfirmationModalProps {
  isVisible?: boolean;
  title: string;
  message: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  actionSheetRef: React.RefObject<ActionSheetRef | null>;
  /** When set, shows an optional text input below the message; onConfirm receives its value. */
  optionalReasonPlaceholder?: string;
  /** When set with optionalReasonPlaceholder, shows chips below the input for quick reason selection. */
  quickReasons?: string[];
  /** Jen jedno potvrzovací tlačítko (bez Zrušit). */
  singlePrimaryAction?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  actionSheetRef,
  optionalReasonPlaceholder,
  quickReasons,
  singlePrimaryAction = false,
}) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [reason, setReason] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const style = isDark ? 'light' : 'dark';
    NavigationBar.setStyle?.(style);
    return () => NavigationBar.setStyle?.('auto');
  }, [isDark]);

  const handleConfirm = () => {
    actionSheetRef.current?.hide();
    const trimmedReason = reason.trim();
    const finalReason = optionalReasonPlaceholder
      ? trimmedReason || (selectedReasons.length ? selectedReasons.join(', ') : undefined)
      : undefined;
    setReason('');
    setSelectedReasons([]);
    onConfirm(finalReason);
  };

  const handleCancel = () => {
    actionSheetRef.current?.hide();
    setReason('');
    setSelectedReasons([]);
    onCancel();
  };

  return (
    <ActionSheetThemed ref={actionSheetRef} gestureEnabled>
      <View className="p-4 pb-6">
        <ThemedText className="mb-1 mt-4 text-left text-lg font-bold">{title}</ThemedText>
        <ThemedText
          className={`text-left text-light-text dark:text-dark-text ${optionalReasonPlaceholder ? 'mb-4' : 'mb-6'}`}>
          {message}
        </ThemedText>
        {optionalReasonPlaceholder ? (
          <View>
            <TextInput
              placeholder={optionalReasonPlaceholder}
              placeholderTextColor="#888"
              value={reason}
              onChangeText={setReason}
              className={`rounded-xl border border-light-secondary bg-light-secondary px-4 py-3 text-base text-light-text dark:border-dark-secondary dark:bg-dark-secondary dark:text-dark-text ${quickReasons?.length ? 'mb-3' : 'mb-6'}`}
            />
            {quickReasons && quickReasons.length > 0 ? (
              <View className="mb-6 flex-row flex-wrap gap-2">
                {quickReasons.map((label) => {
                  const isSelected = selectedReasons.includes(label);
                  return (
                    <Chip
                      key={label}
                      label={label}
                      size="md"
                      selectable
                      isSelected={isSelected}
                      onPress={() => {
                        setSelectedReasons((prev) =>
                          prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
                        );
                      }}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
        <View className="w-full">
          {singlePrimaryAction ? (
            <AppButton
              title={confirmText}
              variant="default"
              size="lg"
              rounded="full"
              fullWidth
              className="w-full"
              onPress={handleConfirm}
            />
          ) : (
            <View className="w-full flex-row justify-center gap-3">
              <AppButton
                title={cancelText}
                variant="outline"
                className="flex-1"
                onPress={handleCancel}
              />
              <AppButton title={confirmText} variant="default" className="flex-1 px-6" onPress={handleConfirm} />
            </View>
          )}
        </View>
      </View>
    </ActionSheetThemed>
  );
};

export default ConfirmationModal;
