import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import ThemedText from './ThemedText';
import Avatar from './Avatar';
import type { Employee } from '@/api/employees';

interface BarberPickerProps {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}

export default function BarberPicker({ employees, value, onChange, label = 'Kadeřník', className = '' }: BarberPickerProps) {
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
        <Pressable
          onPress={() => onChange('')}
          className="items-center w-16 flex-shrink-0 mr-4"
        >
          <View
            className={`rounded-full p-0.5 ${value === '' ? 'border-2 border-highlight' : 'border border-light-secondary dark:border-dark-secondary'}`}
          >
            <Avatar size="lg" name="—" className="bg-light-secondary dark:bg-dark-secondary" />
          </View>
          <ThemedText
            className="text-xs mt-1.5 text-center text-light-subtext dark:text-dark-subtext max-w-[64px]"
            numberOfLines={2}
          >
            Nepřiřazeno
          </ThemedText>
        </Pressable>
        {employees.map((e) => {
          const selected = value === e.id;
          return (
            <Pressable
              key={e.id}
              onPress={() => onChange(e.id)}
              className="items-center w-16 flex-shrink-0 mr-4"
            >
              <View
                className={`rounded-full p-0.5 ${selected ? 'border-2 border-highlight' : 'border border-light-secondary dark:border-dark-secondary'}`}
              >
                <Avatar size="lg" src={e.avatarUrl ?? undefined} name={e.name} />
              </View>
              <ThemedText
                className={`text-xs mt-1.5 text-center max-w-[64px] ${selected ? 'font-medium text-light-primary dark:text-dark-primary' : 'text-light-subtext dark:text-dark-subtext'}`}
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
