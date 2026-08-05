import * as NavigationBar from 'expo-navigation-bar';
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  ViewStyle,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

import { InputVariant } from './Input';

import useThemeColors from '@/contexts/ThemeColors';
import { useTheme } from '@/contexts/ThemeContext';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface SelectOption {
  label: string;
  value: string | number;
  shortLabel?: string;
  sheetFlag?: string;
  sheetName?: string;
  sheetDial?: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  className?: string;
  style?: ViewStyle;
  variant?: InputVariant;
  searchable?: boolean;
  searchPlaceholder?: string;
  sheetTitle?: string;
  searchEmptyLabel?: string;
  filterOptions?: (query: string, options: SelectOption[]) => SelectOption[];
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = '',
  options,
  value,
  onChange,
  error,
  className,
  style,
  variant = 'animated',
  searchable = false,
  searchPlaceholder = '',
  sheetTitle,
  searchEmptyLabel,
  filterOptions,
}) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOption, setSelectedOption] = useState<SelectOption | undefined>(
    options.find((option) => option.value === value)
  );

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    if (filterOptions) return filterOptions(searchQuery, options);
    if (!searchQuery.trim()) return options;
    return options;
  }, [options, searchable, searchQuery, filterOptions]);

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.bg);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');

      return () => {
        // Reset to default theme color when component unmounts
        NavigationBar.setBackgroundColorAsync(colors.bg);
        NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      };
    }
  }, [isDark, colors.bg]);

  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    if (variant !== 'classic') {
      Animated.timing(animatedLabelValue, {
        toValue: isFocused || selectedOption ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, selectedOption, animatedLabelValue, variant]);

  const labelStyle = {
    top: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.placeholder, colors.text],
    }),
    left: 12,
    paddingHorizontal: 8,
  };

  const underlinedLabelStyle = {
    top: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedLabelValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.placeholder, colors.text],
    }),
    left: 0,
    paddingHorizontal: 0,
  };

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onChange(option.value);
    actionSheetRef.current?.hide();
  };

  const handlePress = () => {
    setIsFocused(true);
    setSearchQuery('');
    actionSheetRef.current?.show();
  };

  const handleClose = () => {
    setIsFocused(false);
    setSearchQuery('');
  };

  const renderSheetOptionLabel = (option: SelectOption) => {
    if (option.sheetFlag != null || option.sheetName != null || option.sheetDial != null) {
      return (
        <View className="flex-row items-center">
          <View className="min-w-0 flex-1 flex-row items-center gap-3">
            <ThemedText className="w-8 text-left text-xl leading-6">{option.sheetFlag ?? ''}</ThemedText>
            <ThemedText className="min-w-0 flex-1 text-left text-base" numberOfLines={1}>
              {option.sheetName ?? ''}
            </ThemedText>
          </View>
          <ThemedText className="ml-3 text-right text-base text-light-subtext dark:text-dark-subtext">
            {option.sheetDial ?? ''}
          </ThemedText>
        </View>
      );
    }
    return <ThemedText>{option.label}</ThemedText>;
  };

  // Render the action sheet
  const renderActionSheet = () => (
    <ActionSheet
      ref={actionSheetRef}
      onClose={handleClose}
      isModal
      enableGesturesInScrollView
      statusBarTranslucent
      drawUnderStatusBar={false}
      containerStyle={{
        backgroundColor: colors.bg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      animated
      openAnimationConfig={{
        stiffness: 3000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }}
      closeAnimationConfig={{
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }}>
      <View className="px-4 pt-4">
        {searchable && sheetTitle ? (
          <ThemedText className="mb-3 text-lg font-semibold text-light-text dark:text-dark-text">
            {sheetTitle}
          </ThemedText>
        ) : null}
        {searchable ? (
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            className="mb-3 h-12 rounded-xl border border-neutral-200 bg-light-primary px-4 text-base text-light-text dark:border-neutral-700 dark:bg-dark-primary dark:text-dark-text"
          />
        ) : null}
      </View>
      <ScrollView
        style={{ maxHeight: Dimensions.get('window').height * 0.6 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled">
        {filteredOptions.length === 0 ? (
          <ThemedText className="px-4 py-3 text-light-subtext dark:text-dark-subtext">
            {searchEmptyLabel ?? '—'}
          </ThemedText>
        ) : (
          filteredOptions.map((option) => (
            <Pressable
              key={String(option.value)}
              onPress={() => handleSelect(option)}
              className={`mb-2 rounded-lg px-4 py-3 ${selectedOption?.value === option.value ? 'bg-light-secondary dark:bg-dark-secondary' : ''}`}>
              {renderSheetOptionLabel(option)}
            </Pressable>
          ))
        )}
      </ScrollView>
    </ActionSheet>
  );

  // Classic variant
  if (variant === 'classic') {
    return (
      <View className={`mb-4 ${className || ''}`} style={style}>
        {label && <ThemedText className="mb-1 font-medium">{label}</ThemedText>}
        <View className="relative">
          <TouchableOpacity
            onPress={handlePress}
            className={`h-14 w-full flex-row items-center justify-between rounded-xl border bg-transparent px-4 py-3 
                            ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
                            ${error ? 'border-red-500 dark:border-red-400' : ''}`}>
            <ThemedText
              className={selectedOption ? '' : 'text-light-subtext dark:text-dark-subtext'}>
              {selectedOption ? (selectedOption.shortLabel ?? selectedOption.label) : placeholder}
            </ThemedText>
            <Icon name="ChevronDown" size={20} />
          </TouchableOpacity>
        </View>
        {error && <Text className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</Text>}
        {renderActionSheet()}
      </View>
    );
  }

  // Underlined variant
  if (variant === 'underlined') {
    return (
      <View className={`mb-4 ${className || ''}`} style={style}>
        <View className="relative">
          <Pressable
            className="z-40 bg-light-primary px-0 dark:bg-dark-primary"
            onPress={handlePress}>
            <Animated.Text
              style={[underlinedLabelStyle]}
              className="absolute z-50 bg-light-primary text-black dark:bg-dark-primary dark:text-white">
              {label}
            </Animated.Text>
          </Pressable>
          <TouchableOpacity
            onPress={handlePress}
            className={`h-14 w-full flex-row items-center justify-between border-b-2 border-l-0 border-r-0 border-t-0 bg-transparent px-0 py-3 
                            ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
                            ${error ? 'border-red-500 dark:border-red-400' : ''}`}>
            <ThemedText
              className={selectedOption ? '' : 'text-light-subtext dark:text-dark-subtext'}>
              {selectedOption ? selectedOption.label : ''}
            </ThemedText>
            <Icon name="ChevronDown" size={20} />
          </TouchableOpacity>
        </View>
        {error && <Text className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</Text>}
        {renderActionSheet()}
      </View>
    );
  }

  // Default animated variant
  return (
    <View className={`mb-4 ${className || ''}`} style={style}>
      <View className="relative">
        <Pressable
          className="z-40 bg-light-primary px-1 dark:bg-dark-primary"
          onPress={handlePress}>
          <Animated.Text
            style={[labelStyle]}
            className="absolute z-50 bg-light-primary px-1 text-black dark:bg-dark-primary dark:text-white">
            {label}
          </Animated.Text>
        </Pressable>
        <TouchableOpacity
          onPress={handlePress}
          className={`h-14 w-full flex-row items-center justify-between rounded-xl border bg-transparent px-4 py-3 
                        ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
                        ${error ? 'border-red-500 dark:border-red-400' : ''}`}>
          <ThemedText className={selectedOption ? '' : 'text-light-subtext dark:text-dark-subtext'}>
            {selectedOption ? selectedOption.label : placeholder}
          </ThemedText>
          <Icon name="ChevronDown" size={20} />
        </TouchableOpacity>
      </View>
      {error && <Text className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</Text>}
      {renderActionSheet()}
    </View>
  );
};

export default Select;
