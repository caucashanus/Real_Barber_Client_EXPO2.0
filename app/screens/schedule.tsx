import React, { useEffect, useState, useMemo } from 'react';
import { View, Image } from 'react-native';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import { shadowPresets } from '@/utils/useShadow';
import Grid from '@/components/layout/Grid';
import { Chip } from '@/components/Chip';
import { CardScroller } from '@/components/CardScroller';
import { DatePicker } from '@/components/forms/DatePicker';
import { useAuth } from '@/app/contexts/AuthContext';
import { getEmployees, type Employee } from '@/api/employees';
import type { EmployeeBranch } from '@/api/employees';
import { getBranches, type Branch } from '@/api/branches';

/** API uses Cyrillic day names: Sun .. Sat */
const WEEKDAY_API_KEYS = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

function hasShiftOnDate(emp: Employee, date: Date): boolean {
  const ws = emp.workSchedule as { weeklySchedule?: Record<string, Array<{ validFrom?: string; validUntil?: string }>> } | undefined;
  const weekly = ws?.weeklySchedule;
  if (!weekly || typeof weekly !== 'object') return false;
  const dayIndex = date.getDay();
  const dayKey = WEEKDAY_API_KEYS[dayIndex];
  const slots = weekly[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return false;
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  for (const slot of slots) {
    const from = slot.validFrom ? slot.validFrom.slice(0, 10) : '';
    const until = slot.validUntil ? slot.validUntil.slice(0, 10) : '';
    if (from && until && dateStr >= from && dateStr <= until) return true;
  }
  return false;
}

function getEmployeeBranchIds(emp: Employee): string[] {
  const b = emp.branches as EmployeeBranch[] | Record<string, EmployeeBranch> | undefined;
  if (!b) return [];
  if (Array.isArray(b)) return b.map((x) => x.id);
  return Object.values(b).map((x) => x.id);
}

const ScheduleScreen = () => {
  const { apiToken } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    setLoading(true);
    Promise.all([
      getEmployees(apiToken, {}),
      getBranches(apiToken, {}),
    ])
      .then(([empList, branchList]) => {
        setEmployees(Array.isArray(empList) ? empList : Object.values(empList));
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch(() => {
        setEmployees([]);
        setBranches([]);
      })
      .finally(() => setLoading(false));
  }, [apiToken]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!hasShiftOnDate(emp, selectedDate)) return false;
      if (selectedBranchId === null) return true;
      return getEmployeeBranchIds(emp).includes(selectedBranchId);
    });
  }, [employees, selectedDate, selectedBranchId]);

  return (
    <>
      <Header title=" " showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section title="Schedule" titleSize="3xl" className="py-10" />

        <DatePicker
          label="Date"
          value={selectedDate}
          onChange={setSelectedDate}
          containerClassName="mb-4"
        />

        <CardScroller className="mb-4">
          <Chip
            size="lg"
            label="All"
            selectable
            isSelected={selectedBranchId === null}
            onPress={() => setSelectedBranchId(null)}
          />
          {branches.map((b) => (
            <Chip
              key={b.id}
              size="lg"
              label={b.name}
              selectable
              isSelected={selectedBranchId === b.id}
              onPress={() => setSelectedBranchId(b.id)}
            />
          ))}
        </CardScroller>

        {loading ? (
          <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
        ) : filteredEmployees.length === 0 ? (
          <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
            No employees with a shift on this date{selectedBranchId ? ' at this branch' : ''}.
          </ThemedText>
        ) : (
          <Grid columns={2} spacing={10}>
            {filteredEmployees.map((emp) => (
              <ScheduleCard
                key={emp.id}
                name={emp.name}
                image={emp.avatarUrl ?? require('@/assets/img/room-1.avif')}
              />
            ))}
          </Grid>
        )}
      </ThemedScroller>
    </>
  );
};

interface ScheduleCardProps {
  name: string;
  image: string | number;
}

const ScheduleCard = ({ name, image }: ScheduleCardProps) => {
  return (
    <View style={{ ...shadowPresets.large }} className="bg-light-primary dark:bg-dark-secondary rounded-3xl p-4">
      <View className="w-12 h-12 rounded-full mb-20 overflow-hidden bg-neutral-200 dark:bg-neutral-800">
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <ThemedText className="text-xl font-semibold mb-1" numberOfLines={1}>{name}</ThemedText>
      <View className="flex-row items-center w-full">
        <View className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-1 mr-3">
          <View className="h-full bg-highlight rounded-full" style={{ width: '50%' }} />
        </View>
        <ThemedText className="text-sm opacity-50">2/4</ThemedText>
      </View>
    </View>
  );
};

export default ScheduleScreen;
