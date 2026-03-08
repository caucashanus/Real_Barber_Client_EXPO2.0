import { View, Pressable, Text } from 'react-native';
import Header from '@/components/Header';
import ListLink from '@/components/ListLink';
import AnimatedView from '@/components/AnimatedView';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import { useLanguage } from '@/app/contexts/LanguageContext';

export default function SettingsScreen() {
    const { locale, toggleLocale } = useLanguage();

    const buttonLabel = locale === 'en' ? 'Přepnout do češtiny' : 'Přepnout do angličtiny';

    return (
        <AnimatedView className='flex-1 bg-light-primary dark:bg-dark-primary' animation='fadeIn' duration={350} playOnlyOnce={false}>
            <Header showBackButton />
            <ThemedScroller>
                <Section titleSize='3xl' className='pt-4 pb-10 px-4' title="Settings" subtitle="Manage your account settings" />

                <View className='px-4'>
                    <ListLink title="Payments" description="Manage payment methods" icon="CreditCard" href="/screens/profile/payments" />
                    <ListLink title="Notifications" description="Push notifications, email notifications" icon="Bell" href="/screens/profile/notifications" />
                    <ListLink title="Currency" description="USD - United states dollar" icon="DollarSign" href="/screens/profile/currency" />
                    <ListLink title="Change password" description="Change your password" icon="KeyRound" href="/screens/change-password" />
                    <ListLink title="Help" description="Contact support" icon="HelpCircle" href="/screens/help" />
                </View>

                <View className='items-center justify-center pb-8 pt-6'>
                    <Pressable
                        onPress={toggleLocale}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.5,
                            shadowRadius: 3.84,
                            elevation: 8,
                        }}
                        className='bg-neutral-900 dark:bg-neutral-100 rounded-full py-3 w-[220px] items-center justify-center'
                    >
                        <Text className='text-white text-base font-medium dark:text-neutral-900'>
                            {buttonLabel}
                        </Text>
                    </Pressable>
                </View>
            </ThemedScroller>
        </AnimatedView>
    );
}