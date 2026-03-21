import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Platform, Animated, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeColors } from '@/app/contexts/ThemeColors';
import { formatToYYYYMMDD } from '@/utils/date';
import ThemedText from '@/components/ThemedText';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { InputVariant } from './Input';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  error?: string;
  containerClassName?: string;
  variant?: InputVariant;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  maxDate,
  minDate,
  error,
  containerClassName = '',
  variant = 'animated',
}) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const [isFocused, setIsFocused] = useState(false);
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { locale: appLocale } = useLanguage();
  /** BCP 47 – měsíce v iOS spinneru; tlačítka modalu přes t() */
  const pickerLocale = appLocale === 'cs' ? 'cs-CZ' : 'en-GB';
  const animatedLabelValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (variant !== 'classic') {
      Animated.timing(animatedLabelValue, {
        toValue: (isFocused || value) ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFocused, value, animatedLabelValue, variant]);

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

  const showDatePicker = () => {
    setIsFocused(true);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setIsFocused(false);
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      hideDatePicker();
      if (selectedDate) {
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    hideDatePicker();
  };

  // Helper function to render date picker modal/component
  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          isVisible={isDatePickerVisible}
          onBackdropPress={hideDatePicker}
          style={{ margin: 0, justifyContent: 'flex-end' }}
        >
          <View className="bg-light-primary dark:bg-dark-primary rounded-t-xl items-center justify-center w-full">
            <View className="flex-row justify-between items-center p-4 border-b border-light-secondary dark:border-dark-secondary w-full">
              <Button
                title={t('datePickerCancel')}
                variant="ghost"
                onPress={hideDatePicker}
                textClassName="text-base font-normal"
              />
              <ThemedText className="text-lg font-medium">
                {label || 'Select Date'}
              </ThemedText>
              <Button
                title={t('datePickerDone')}
                variant="ghost"
                onPress={handleConfirm}
                textClassName="text-base font-semibold"
              />
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={maxDate}
              minimumDate={minDate}
              locale={pickerLocale}
              themeVariant={colors.isDark ? 'dark' : 'light'}
              style={{ backgroundColor: colors.bg }}
            />
          </View>
        </Modal>
      );
    } else {
      return isDatePickerVisible && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={maxDate}
          minimumDate={minDate}
          locale={pickerLocale}
        />
      );
    }
  };

  // Classic non-animated variant
  if (variant === 'classic') {
    return (
      <View className={`mb-global ${containerClassName}`}>
        {label && (
          <ThemedText className="mb-1 font-medium">{label}</ThemedText>
        )}
        <View className="relative">
          <TouchableOpacity
            onPress={showDatePicker}
            className={`border rounded-xl py-4 px-3 h-14 pr-10 text-black dark:text-white bg-transparent
              ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
              ${error ? 'border-red-500 dark:border-red-400' : ''}`}
          >
            <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
              {value ? formatToYYYYMMDD(value) : placeholder}
            </ThemedText>
          </TouchableOpacity>
          <Pressable className="absolute right-3 top-[18px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>
        {error && (
          <ThemedText className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Underlined variant
  if (variant === 'underlined') {
    return (
      <View className={`mb-global ${containerClassName}`}>
        <View className="relative">
          <Pressable className='px-0 bg-light-primary dark:bg-dark-primary z-40' onPress={showDatePicker}>
            <Animated.Text 
              style={[underlinedLabelStyle]} 
              className="absolute z-50 bg-light-primary dark:bg-dark-primary text-black dark:text-white"
            >
              {label}
            </Animated.Text>
          </Pressable>
          <TouchableOpacity
            onPress={showDatePicker}
            className={`border-b-2 py-4 px-0 h-14 pr-10 text-black dark:text-white bg-transparent border-t-0 border-l-0 border-r-0
              ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
              ${error ? 'border-red-500 dark:border-red-400' : ''}`}
          >
            <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
              {value ? formatToYYYYMMDD(value) : ''}
            </ThemedText>
          </TouchableOpacity>
          <Pressable className="absolute right-0 top-[18px] z-10">
            <Icon name="Calendar" size={20} color={colors.text} />
          </Pressable>
        </View>
        {error && (
          <ThemedText className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</ThemedText>
        )}
        {renderDatePicker()}
      </View>
    );
  }

  // Default animated variant
  return (
    <View className={`mb-global ${containerClassName}`}>
      <View className="relative">
        <Pressable className='px-1 bg-light-primary dark:bg-dark-primary z-40' onPress={showDatePicker}>
          <Animated.Text 
            style={[labelStyle]} 
            className="absolute z-50 px-1 bg-light-primary dark:bg-dark-primary text-black dark:text-white"
          >
            {label}
          </Animated.Text>
        </Pressable>
        <TouchableOpacity
          onPress={showDatePicker}
          className={`border rounded-xl py-4 px-3 h-14 pr-10 text-black dark:text-white bg-transparent
            ${isFocused ? 'border-neutral-400 dark:border-neutral-500' : 'border-neutral-200 dark:border-neutral-700'}
            ${error ? 'border-red-500 dark:border-red-400' : ''}`}
        >
          <ThemedText className={value ? 'text-base' : 'text-base text-gray-500'}>
            {value ? formatToYYYYMMDD(value) : ''}
          </ThemedText>
        </TouchableOpacity>
        <Pressable className="absolute right-3 top-[18px] z-10">
          <Icon name="Calendar" size={20} color={colors.text} />
        </Pressable>
      </View>
      {error && (
        <ThemedText className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</ThemedText>
      )}
      {renderDatePicker()}
    </View>
  );
}; 