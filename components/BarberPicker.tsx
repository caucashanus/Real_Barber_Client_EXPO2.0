import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';

import Avatar from './Avatar';
import ThemedText from './ThemedText';

import type { Employee } from '@/api/employees';
import useThemeColors from '@/app/contexts/ThemeColors';

interface BarberPickerProps {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

export default function BarberPicker({
  employees,
  value,
  onChange,
  label = 'Kadeřník',
  className = '',
}: BarberPickerProps) {
  const colors = useThemeColors();
  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <ThemedText className="mb-2 text-sm text-light-subtext dark:text-dark-subtext">
          {label}
        </ThemedText>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4, paddingRight: 16 }}>
        {employees.map((e) => {
          const selected = value === e.id;
          return (
            <Pressable
              key={e.id}
              onPress={() => onChange(e.id)}
              className="mr-5 w-20 flex-shrink-0 items-center">
              <View
                style={selected ? { borderColor: colors.highlight } : undefined}
                className={`rounded-full p-0.5 ${selected ? 'border-2' : 'border border-light-secondary dark:border-dark-secondary'}`}>
                <Avatar size="xl" src={e.avatarUrl ?? undefined} name={e.name} />
              </View>
              <ThemedText
                className={`mt-2 max-w-[80px] text-center text-sm ${selected ? 'font-medium text-light-text dark:text-dark-text' : 'text-light-subtext dark:text-dark-subtext'}`}
                numberOfLines={2}>
                {e.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
