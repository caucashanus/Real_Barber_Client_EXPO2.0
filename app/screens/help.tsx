import React from 'react';
import { View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Expandable from '@/components/Expandable';
import Section from '@/components/layout/Section';
import Icon from '@/components/Icon';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import { useTranslation } from '@/app/hooks/useTranslation';
import type { TranslationKey } from '@/locales';

const FAQ_KEYS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'helpFaq1Q', a: 'helpFaq1A' },
  { q: 'helpFaq2Q', a: 'helpFaq2A' },
  { q: 'helpFaq3Q', a: 'helpFaq3A' },
  { q: 'helpFaq4Q', a: 'helpFaq4A' },
  { q: 'helpFaq5Q', a: 'helpFaq5A' },
  { q: 'helpFaq6Q', a: 'helpFaq6A' },
  { q: 'helpFaq7Q', a: 'helpFaq7A' },
  { q: 'helpFaq8Q', a: 'helpFaq8A' },
  { q: 'helpFaq9Q', a: 'helpFaq9A' },
  { q: 'helpFaq10Q', a: 'helpFaq10A' },
];

const HELP_EMAIL = 'info@realbarber.cz';
const HELP_TEL_URI = 'tel:+420608332881';

const CONTACT_ROWS: {
  id: string;
  typeKey: TranslationKey;
  valueKey: TranslationKey;
  icon: 'Mail' | 'Phone' | 'Clock';
  action?: () => void;
}[] = [
  {
    id: 'email',
    typeKey: 'helpContactEmailType',
    valueKey: 'helpContactEmailValue',
    icon: 'Mail',
    action: () => Linking.openURL(`mailto:${HELP_EMAIL}`),
  },
  {
    id: 'phone',
    typeKey: 'helpContactPhoneType',
    valueKey: 'helpContactPhoneValue',
    icon: 'Phone',
    action: () => Linking.openURL(HELP_TEL_URI),
  },
  {
    id: 'hours',
    typeKey: 'helpContactHoursType',
    valueKey: 'helpContactHoursValue',
    icon: 'Clock',
  },
];

export default function HelpScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={t('helpTitle')} showBackButton />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <AnimatedView animation="fadeIn" duration={400}>
          {/* FAQ Section */}
          <Section 
            title={t('helpFaq')} 
            titleSize="xl" 
            className="px-global pt-6 pb-2"
          />
          
          <View className="px-global">
            {FAQ_KEYS.map((keys) => (
              <Expandable
                key={keys.q}
                title={t(keys.q)}
                className="py-1"
              >
                <ThemedText className="text-light-text dark:text-dark-text leading-6">
                  {t(keys.a)}
                </ThemedText>
              </Expandable>
            ))}
          </View>
          
          {/* Contact Section */}
          <Section 
            title={t('helpContactUs')} 
            titleSize="xl" 
            className="px-global pb-2 mt-14"
            subtitle={t('helpContactSubtitle')}
          />
          
          <View className="px-global pb-8">
            {CONTACT_ROWS.map((contact) => (
              <TouchableOpacity 
                key={contact.id}
                onPress={contact.action}
                disabled={!contact.action}
                className="flex-row items-center py-4 border-b border-light-secondary dark:border-dark-secondary"
              >
                <View className="w-10 h-10 rounded-full bg-light-secondary dark:bg-dark-secondary items-center justify-center mr-4">
                  <Icon name={contact.icon} size={20} />
                </View>
                <View className="flex-1 pr-2">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t(contact.typeKey)}
                  </ThemedText>
                  <ThemedText className="font-medium">
                    {t(contact.valueKey)}
                  </ThemedText>
                </View>
                {contact.action && (
                  <Icon name="ChevronRight" size={20} className="ml-auto text-light-subtext dark:text-dark-subtext" />
                )}
              </TouchableOpacity>
            ))}
            
            <Button 
              title={t('helpContactSupport')} 
              iconStart="MessageCircle"
              className="mt-8"
              onPress={() => Linking.openURL(`mailto:${HELP_EMAIL}`)}
            />
          </View>
        </AnimatedView>
      </ScrollView>
    </View>
  );
}
