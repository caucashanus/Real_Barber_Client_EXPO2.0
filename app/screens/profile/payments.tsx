import AntDesign from '@expo/vector-icons/AntDesign';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Dimensions,
  Pressable,
} from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import Toggle from '@/components/Toggle';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';

const { width } = Dimensions.get('window');
// Sample payment methods
const initialPaymentMethods = [
  {
    id: '1',
    type: 'credit_card',
    cardNumber: '4242',
    cardHolder: 'John Doe',
    expiryDate: '05/25',
    isDefault: true,
    brand: 'Visa',
  },
  {
    id: '2',
    type: 'credit_card',
    cardNumber: '5678',
    cardHolder: 'John Doe',
    expiryDate: '08/24',
    isDefault: false,
    brand: 'Mastercard',
  },
];

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Get card brand icon based on card number
  const getCardBrandIcon = (brand: string) => {
    switch (brand) {
      case 'Visa':
        return 'CreditCard' as const; // Using Icon component - ideally would use specific card logos
      case 'Mastercard':
        return 'CreditCard' as const;
      case 'Amex':
        return 'CreditCard' as const;
      default:
        return 'CreditCard' as const;
    }
  };

  // Handle add new card
  const handleAddCard = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiryDate('');
    setCvv('');
    setIsDefault(paymentMethods.length === 0);
    setIsModalVisible(true);
  };

  // Handle save card
  const handleSaveCard = () => {
    // Simple validation
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      // Would show validation errors in a real app
      return;
    }

    const maskedCardNumber = '•••• •••• •••• ' + cardNumber.slice(-4);

    const newCard = {
      id: `${Date.now()}`,
      type: 'credit_card',
      cardNumber: maskedCardNumber,
      cardHolder,
      expiryDate,
      isDefault,
      brand: 'Visa', // Would determine based on card number in real app
    };

    if (isDefault) {
      // Update other methods to not be default
      setPaymentMethods((prevMethods) =>
        prevMethods.map((method) => ({ ...method, isDefault: false }))
      );
    }

    setPaymentMethods((prevMethods) => [...prevMethods, newCard]);
    setIsModalVisible(false);
  };

  // Handle set default
  const handleSetDefault = (id: string) => {
    setPaymentMethods((prevMethods) =>
      prevMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  // Handle delete card
  const handleDeleteCard = (id: string) => {
    setPaymentMethods((prevMethods) => prevMethods.filter((method) => method.id !== id));
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={t('paymentsTitle')} showBackButton />

      <ScrollView className="flex-1">
        {/*<Section
          title="Your cards"
          className="px-global pt-10"
          titleSize='xl'
          />*/}

        <View className="mt-4 px-global">
          <CardScroller>
            {paymentMethods.map((method) => (
              <CardPreview
                key={method.id}
                cardNumber={method.cardNumber}
                cardHolder={method.cardHolder}
                expiryDate={method.expiryDate}
                brand={method.brand}
                isDefault={method.isDefault}
                onSetDefault={() => handleSetDefault(method.id)}
                onDelete={() => handleDeleteCard(method.id)}
              />
            ))}
          </CardScroller>
          {/*<Button
            title="Add New Card"
            iconStart="Plus"
            variant="outline"
            className="mt-4"
            onPress={handleAddCard}
          />*/}
        </View>

        {/*} <Section
          title="Digital Wallets"
          className="px-global mt-14"
        />*/}

        <View className="mt-4 px-global pb-8">
          {/* Apple Pay - only on iOS */}

          <TouchableOpacity className="flex-row items-center border-b border-light-secondary py-4 dark:border-dark-secondary">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-lg bg-light-secondary dark:bg-dark-secondary">
              <AntDesign name="apple" size={24} color={colors.icon} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{t('paymentsApplePay')}</ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('paymentsApplePaySetup')}
              </ThemedText>
            </View>
            <Icon name="ChevronRight" size={20} />
          </TouchableOpacity>

          {/* Google Pay - available on both platforms */}
          <TouchableOpacity className="flex-row items-center border-b border-light-secondary py-4 dark:border-dark-secondary">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-lg bg-light-secondary dark:bg-dark-secondary">
              <AntDesign name="google" size={24} color={colors.icon} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{t('paymentsGooglePay')}</ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                {t('paymentsGooglePaySetup')}
              </ThemedText>
            </View>
            <Icon name="ChevronRight" size={20} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View className="h-screen flex-1 justify-center bg-black/50 p-global">
          <View className="rounded-xl bg-light-primary p-4 dark:bg-dark-primary">
            <View className="mb-6 flex-row items-center justify-between">
              <ThemedText className="text-xl font-semibold">{t('paymentsAddCard')}</ThemedText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon name="X" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView className=" pt-4">
              <Input
                label={t('paymentsCardNumber')}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
              />

              <Input
                label={t('paymentsCardholder')}
                value={cardHolder}
                onChangeText={setCardHolder}
                placeholder="John Doe"
              />

              {/* Inputs in a row with the fixed input component */}

              <Input
                label={t('paymentsExpiry')}
                containerClassName="flex-1"
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="MM/YY"
                inRow
              />

              <Input
                label={t('paymentsCvv')}
                containerClassName="flex-1"
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                keyboardType="numeric"
                secureTextEntry
                inRow
              />

              <View className="mb-4 flex-row items-center justify-between py-4">
                <ThemedText>{t('paymentsSetAsDefault')}</ThemedText>
                <Toggle value={isDefault} onChange={setIsDefault} />
              </View>
            </ScrollView>

            <View className="mt-4 flex-row gap-4 border-t border-light-secondary pt-2 dark:border-dark-secondary">
              <Button
                title={t('paymentsCancel')}
                variant="ghost"
                className="flex-1"
                onPress={() => setIsModalVisible(false)}
              />
              <Button title={t('paymentsSaveCard')} className="flex-1" onPress={handleSaveCard} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CardPreview = (props: {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  brand: string;
  isDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}) => {
  return (
    <View
      className={`flex h-60 flex-col justify-end rounded-2xl ${props.brand === 'Visa' ? 'bg-lime-300' : 'bg-sky-300'}`}
      style={{ width: width - 40, ...shadowPresets.large }}>
      <LinearGradient
        colors={[
          props.brand === 'Visa' ? '#BBF451' : '#74D4FF',
          props.brand === 'Visa' ? '#DEFF9F' : '#ACE3FF',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="flex h-full flex-col justify-end rounded-2xl p-6">
        <Text className="font-outfit-bold text-xl">•••• •••• •••• {props.cardNumber}</Text>
        <View className="flex-row justify-between">
          <Text>{props.cardHolder}</Text>
          <Text>{props.expiryDate}</Text>
        </View>

        <View className="absolute right-6 top-6 w-full flex-row justify-between">
          <Text className="font-outfit-bold text-lg">{props.brand}</Text>
          {/*<TouchableOpacity onPress={props.onDelete} className='ml-auto mr-4'>
            <Icon name="Trash2" size={20} color="black" />
          </TouchableOpacity>*/}
          {props.isDefault ? (
            <View className="items-center justify-center rounded-full bg-black px-2 py-1">
              <Text className="text-xs text-white">Default</Text>
            </View>
          ) : (
            <Pressable
              onPress={props.onSetDefault}
              className="items-center justify-center rounded-full bg-white px-2 py-1">
              <Text className="text-xs text-black">Set as default</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};
