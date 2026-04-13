import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, ScrollView, Pressable, TouchableOpacity } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';

interface Currency {
  code: string;
  title: string;
}

const CurrencyScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currencies: Currency[] = [
    { code: 'USD', title: 'United States Dollar' },
    { code: 'EUR', title: 'Euro' },
    { code: 'GBP', title: 'British Pound' },
    { code: 'CAD', title: 'Canadian Dollar' },
    { code: 'AUD', title: 'Australian Dollar' },
    { code: 'CHF', title: 'Swiss Franc' },
    { code: 'JPY', title: 'Japanese Yen' },
    { code: 'CNY', title: 'Chinese Yuan' },
    { code: 'INR', title: 'Indian Rupee' },
    { code: 'BRL', title: 'Brazilian Real' },
    { code: 'ZAR', title: 'South African Rand' },
    { code: 'MXN', title: 'Mexican Peso' },
  ];

  const saveSettings = () => {
    // Here you would save the selected currency
    navigation.goBack();
  };

  return (
    <View className="bg-light-bg dark:bg-dark-bg flex-1">
      <Header
        showBackButton
        title={t('currencyTitle')}
        rightComponents={[<Button title={t('commonSave')} onPress={saveSettings} />]}
      />
      <ThemedScroller>
        {currencies.map((currency) => (
          <CurrencyItem
            key={currency.code}
            title={currency.title}
            code={currency.code}
            selected={selectedCurrency === currency.code}
            onSelect={() => setSelectedCurrency(currency.code)}
          />
        ))}
      </ThemedScroller>
    </View>
  );
};

interface CurrencyItemProps {
  title: string;
  code: string;
  selected: boolean;
  onSelect: () => void;
}

const CurrencyItem = ({ title, code, selected, onSelect }: CurrencyItemProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      className={`flex-row items-center justify-between border-b border-light-secondary py-4 dark:border-dark-secondary ${selected ? 'opacity-100' : 'opacity-100 '}`}>
      <View>
        <ThemedText className="text-lg font-bold">{code}</ThemedText>
        <ThemedText className="text-light-subtext dark:text-dark-subtext">{title}</ThemedText>
      </View>
      {selected && (
        <AnimatedView animation="bounceIn" duration={500}>
          <Icon name="Check" size={25} />
        </AnimatedView>
      )}
    </TouchableOpacity>
  );
};

export default CurrencyScreen;
