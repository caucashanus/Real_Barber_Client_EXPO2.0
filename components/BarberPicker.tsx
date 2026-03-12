import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import ThemedText from './ThemedText';
import Avatar from './Avatar';
import useThemeColors from '@/app/contexts/ThemeColors';
import type { Employee } from '@/api/employees';

interface BarberPickerProps {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

export default function BarberPicker({ employees, value, onChange, label = 'Kadeřník', className = '' }: BarberPickerProps) {
  const colors = useThemeColors();
  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-2">{label}</ThemedText>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4, paddingRight: 16 }}
      >
        {employees.map((e) => {
          const selected = value === e.id;
          return (
            <Pressable
              key={e.id}
              onPress={() => onChange(e.id)}
              className="items-center w-20 flex-shrink-0 mr-5"
            >
              <View
                style={selected ? { borderColor: colors.highlight } : undefined}
                className={`rounded-full p-0.5 ${selected ? 'border-2' : 'border border-light-secondary dark:border-dark-secondary'}`}
              >
                <Avatar size="xl" src={e.avatarUrl ?? undefined} name={e.name} />
              </View>
              <ThemedText
                className={`text-sm mt-2 text-center max-w-[80px] ${selected ? 'font-medium text-light-text dark:text-dark-text' : 'text-light-subtext dark:text-dark-subtext'}`}
                numberOfLines={2}
              >
                {e.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
