import ThemeScroller from '@/components/ThemeScroller';
import React, { useContext } from 'react';
import { View, Animated, Pressable } from 'react-native';
import AnimatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { ScrollContext } from './_layout';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import Section from '@/components/layout/Section';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';
import useThemeColors from '@/app/contexts/ThemeColors';
import { shadowPresets } from '@/utils/useShadow';

const MOCK_BALANCE = '5 284,63';
const MOCK_CURRENCY = 'RBC';

const MOCK_TRANSACTIONS = [
  { id: '1', name: 'Polar', date: 'Včera, 14:29', amount: '-2 472,02 RBC', sub: '-119,79 $', icon: 'CreditCard' as const },
  { id: '2', name: 'sleek.design', date: 'Včera, 13:04 · Prodejci', amount: '515,45 RBC', sub: undefined, icon: 'ShoppingBag' as const },
  { id: '3', name: 'Real Barber', date: 'Pondělí, 10:15', amount: '-890,00 RBC', sub: undefined, icon: 'Scissors' as const },
  { id: '4', name: 'Voucher', date: 'Neděle, 18:00', amount: '100,00 RBC', sub: undefined, icon: 'Gift' as const },
];

const WalletScreen = () => {
  const scrollY = useContext(ScrollContext);
  const colors = useThemeColors();

  return (
    <ThemeScroller
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      <AnimatedView animation="scaleIn" className="flex-1 mt-4">
        {/* 1. Stav RBC – ve light mode tmavě šedé (ne černé), v dark mode jako dřív */}
        <View className="bg-slate-600 dark:bg-neutral-900 rounded-t-3xl px-6 pt-8 pb-6 mb-0 items-center">
          <ThemedText className="text-sm text-white/80 text-center">Osobní · RBC</ThemedText>
          <ThemedText className="text-3xl font-bold text-white mt-1 text-center">{MOCK_BALANCE} {MOCK_CURRENCY}</ThemedText>
          <View className="items-center mt-4">
            <Button title="Účty" variant="outline" size="small" className="rounded-full px-6 bg-white/10 border-white/30" textClassName="text-white" />
          </View>
        </View>

        {/* 2. Akční tlačítka – stejný blok se stínem */}
        <View style={{ ...shadowPresets.large }} className="flex-row justify-around p-5 -mt-2 rounded-2xl mx-4 bg-light-secondary dark:bg-dark-secondary">
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="Plus" size={24} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Přidat peníze</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="ArrowLeftRight" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Převést</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="Building2" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Údaje</ThemedText>
          </Pressable>
          <Pressable className="items-center">
            <View className="w-14 h-14 rounded-full bg-white dark:bg-dark-primary items-center justify-center">
              <Icon name="MoreVertical" size={22} color={colors.text} />
            </View>
            <ThemedText className="text-xs mt-2 text-light-text dark:text-dark-text">Další</ThemedText>
          </Pressable>
        </View>

        {/* 3. Reklamní banner (mock) – stejný styl jako Continue searching */}
        <View style={{ ...shadowPresets.large }} className="mx-4 mt-4 p-5 rounded-2xl bg-light-secondary dark:bg-dark-secondary">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <ThemedText className="text-lg font-bold text-light-text dark:text-dark-text">FlexiFondy</ThemedText>
              <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                S variabilním úrokem v EUR, GBP nebo USD. Investiční riziko.
              </ThemedText>
            </View>
            <Pressable className="p-1">
              <Icon name="X" size={18} className="text-light-subtext dark:text-dark-subtext" />
            </Pressable>
          </View>
        </View>

        {/* 4. Transakce – stejný blok se stínem jako na Branches */}
        <Section title="Transakce" titleSize="lg" className="mt-6 px-4">
          <View style={{ ...shadowPresets.large }} className="mt-2 p-global rounded-2xl bg-light-secondary dark:bg-dark-secondary overflow-hidden">
          <List variant="divided">
            {MOCK_TRANSACTIONS.map((tx) => (
              <ListItem
                key={tx.id}
                icon={{ name: tx.icon, variant: 'bordered' }}
                title={tx.name}
                subtitle={tx.date}
                trailing={
                  <View className="items-end">
                    <ThemedText className={`text-base font-semibold ${tx.amount.startsWith('-') ? 'text-red-600 dark:text-red-400' : 'text-light-text dark:text-dark-text'}`}>
                      {tx.amount}
                    </ThemedText>
                    {tx.sub != null && (
                      <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">{tx.sub}</ThemedText>
                    )}
                  </View>
                }
              />
            ))}
          </List>
          </View>
        </Section>
      </AnimatedView>
    </ThemeScroller>
  );
};

export default WalletScreen;
