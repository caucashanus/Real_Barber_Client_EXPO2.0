import { Link } from 'expo-router';
import { View, StyleProp, ViewStyle } from 'react-native';

import { Button } from '@/components/Button';
import Icon, { IconName } from '@/components/Icon';
import ThemedText from '@/components/ThemedText';

interface PlaceholderProps {
  title: string;
  subtitle?: string;
  button?: string;
  href?: string;
  icon?: IconName;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Placeholder({
  title,
  subtitle,
  button,
  href,
  icon = 'Inbox',
  className = '',
  style,
}: PlaceholderProps) {
  return (
    <View
      className={`items-center justify-center bg-light-primary p-4 dark:bg-dark-primary ${className}`}
      style={style}>
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full border border-light-secondary dark:border-dark-secondary">
        <Icon name={icon} size={30} className="text-light-tertiary dark:text-dark-tertiary" />
      </View>

      <ThemedText className="text-center text-xl font-bold">{title}</ThemedText>

      {subtitle && (
        <ThemedText className="mb-4 text-center text-light-subtext dark:text-dark-subtext">
          {subtitle}
        </ThemedText>
      )}

      {button && href && (
        <Button className="mt-4" title={button} variant="outline" href={href} rounded="full" />
      )}
    </View>
  );
}
