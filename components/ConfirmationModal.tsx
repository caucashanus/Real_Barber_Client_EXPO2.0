import React, { useState } from 'react';
import { View, Platform, TextInput } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import useThemeColors from '@/app/contexts/ThemeColors';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '@/app/contexts/ThemeContext';

interface ConfirmationModalProps {
    isVisible?: boolean;
    title: string;
    message: string;
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    actionSheetRef: React.RefObject<ActionSheetRef>;
    /** When set, shows an optional text input below the message; onConfirm receives its value. */
    optionalReasonPlaceholder?: string;
    /** When set with optionalReasonPlaceholder, shows chips below the input for quick reason selection. */
    quickReasons?: string[];
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
    quickReasons
}) => {
    const { isDark } = useTheme();
    const colors = useThemeColors();
    const [reason, setReason] = useState('');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.bg);
            NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');

            return () => {
                NavigationBar.setBackgroundColorAsync(colors.bg);
                NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
            };
        }
    }, [isDark, colors.bg]);

    const handleConfirm = () => {
        actionSheetRef.current?.hide();
        const trimmedReason = reason.trim();
        const finalReason =
            optionalReasonPlaceholder
                ? (trimmedReason ||
                    (selectedReasons.length ? selectedReasons.join(', ') : undefined))
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
        <ActionSheetThemed
            ref={actionSheetRef}
            gestureEnabled={true}
        >
            <View className="p-4 pb-6">
                <ThemedText className="text-lg font-bold mt-4 mb-1 text-left">{title}</ThemedText>
                <ThemedText className={`text-left text-light-text dark:text-dark-text ${optionalReasonPlaceholder ? 'mb-4' : 'mb-6'}`}>{message}</ThemedText>
                {optionalReasonPlaceholder ? (
                    <>
                        <TextInput
                            placeholder={optionalReasonPlaceholder}
                            placeholderTextColor="#888"
                            value={reason}
                            onChangeText={setReason}
                            className={`rounded-xl border border-light-secondary dark:border-dark-secondary bg-light-secondary dark:bg-dark-secondary px-4 py-3 text-base text-light-text dark:text-dark-text ${quickReasons?.length ? 'mb-3' : 'mb-6'}`}
                        />
                        {quickReasons && quickReasons.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2 mb-6">
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
                                                    prev.includes(label)
                                                        ? prev.filter((l) => l !== label)
                                                        : [...prev, label]
                                                );
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        ) : null}
                    </>
                ) : null}
                <View className="flex-row w-full justify-center">
                    <Button
                        title={cancelText}
                        variant="outline"
                        className="flex-1"
                        onPress={handleCancel}
                    />
                    <Button
                        title={confirmText}
                        variant="primary"
                        className="ml-3 px-6"
                        onPress={handleConfirm}
                    />
                </View>
            </View>
        </ActionSheetThemed>
    );
};

export default ConfirmationModal;