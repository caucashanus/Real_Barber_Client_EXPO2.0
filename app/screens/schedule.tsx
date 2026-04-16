import { router } from 'expo-router';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Image, Pressable } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getBranches, type Branch } from '@/api/branches';
import { getEmployees, type Employee, type EmployeeBranch } from '@/api/employees';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedScroller from '@/components/ThemeScroller';

import ThemedText from '@/components/ThemedText';
import { DatePicker } from '@/components/forms/DatePicker';
import Grid from '@/components/layout/Grid';
import Section from '@/components/layout/Section';
import { shadowPresets } from '@/utils/useShadow';
import { CardScroller } from '@/components/CardScroller';

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

/** Slot směny z API – obsahuje branch této konkrétní směny (pobočka daného dne). */
type WorkScheduleSlot = {
  validFrom?: string;
  validUntil?: string;
  branch?: { id: string; name: string };
  [key: string]: unknown;
};

function hasShiftOnDate(emp: Employee, date: Date): boolean {
  const ws = emp.workSchedule as
    | { weeklySchedule?: Record<string, WorkScheduleSlot[]> }
    | undefined;
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

/** Pro dané datum vrací názvy poboček z těch slotů (směn), které padnou na tento den – z slot.branch.name. */
function getBranchNamesFromShiftsOnDate(emp: Employee, date: Date): string[] {
  const ws = emp.workSchedule as
    | { weeklySchedule?: Record<string, WorkScheduleSlot[]> }
    | undefined;
  const weekly = ws?.weeklySchedule;
  if (!weekly || typeof weekly !== 'object') return [];
  const dayIndex = date.getDay();
  const dayKey = WEEKDAY_API_KEYS[dayIndex];
  const slots = weekly[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const names: string[] = [];
  const seen = new Set<string>();
  for (const slot of slots) {
    const from = slot.validFrom ? slot.validFrom.slice(0, 10) : '';
    const until = slot.validUntil ? slot.validUntil.slice(0, 10) : '';
    if (!from || !until || dateStr < from || dateStr > until) continue;
    const name = slot.branch?.name?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

function getEmployeeBranchIds(emp: Employee): string[] {
  const b = emp.branches as EmployeeBranch[] | Record<string, EmployeeBranch> | undefined;
  if (!b) return [];
  if (Array.isArray(b)) return b.map((x) => x.id);
  return Object.values(b).map((x) => x.id);
}

/** Názvy poboček pro indikátor na kartě: pouze pobočky konkrétních směn v daný den (ze slot.branch.name). Fallback: při filtru pobočky její název, jinak všechny pobočky zaměstnance. */
function getBranchNamesForDate(
  emp: Employee,
  date: Date,
  branches: Branch[],
  selectedBranchId: string | null
): string[] {
  const namesFromSlots = getBranchNamesFromShiftsOnDate(emp, date);
  if (namesFromSlots.length > 0) return namesFromSlots;
  if (selectedBranchId !== null) {
    const name = branches.find((b) => b.id === selectedBranchId)?.name;
    return name ? [name] : [];
  }
  const b = emp.branches as EmployeeBranch[] | Record<string, EmployeeBranch> | undefined;
  if (!b) return [];
  const list = Array.isArray(b) ? b : Object.values(b);
  return list.map((x) => x.name).filter(Boolean);
}

const ScheduleScreen = () => {
  const { apiToken } = useAuth();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const employeeSheetRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    if (!apiToken) return;
    setLoading(true);
    Promise.all([getEmployees(apiToken, {}), getBranches(apiToken, {})])
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

  const isToday = useMemo(() => {
    const d = new Date();
    return (
      selectedDate.getDate() === d.getDate() &&
      selectedDate.getMonth() === d.getMonth() &&
      selectedDate.getFullYear() === d.getFullYear()
    );
  }, [selectedDate]);

  const isTomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return (
      selectedDate.getDate() === d.getDate() &&
      selectedDate.getMonth() === d.getMonth() &&
      selectedDate.getFullYear() === d.getFullYear()
    );
  }, [selectedDate]);

  const dateVariant = isToday ? 'today' : isTomorrow ? 'tomorrow' : null;
  const headerIndicator =
    dateVariant === 'today'
      ? [<LiveIndicator key="live" size="lg" />]
      : dateVariant === 'tomorrow'
        ? [<LiveIndicator key="live" variant="orange" size="lg" />]
        : [];

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const scheduleArrows = (
    <View className="ml-auto flex-row items-center">
      <Pressable
        onPress={goToPrevDay}
        disabled={isToday}
        className={`mr-2 h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 ${
          isToday ? 'opacity-30' : 'opacity-100'
        }`}>
        <Icon name="ChevronLeft" size={24} className="-translate-x-px" />
      </Pressable>
      <Pressable
        onPress={goToNextDay}
        className="h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600">
        <Icon name="ChevronRight" size={24} className="translate-x-px" />
      </Pressable>
    </View>
  );

  return (
    <>
      <Header title=" " showBackButton rightComponents={headerIndicator} />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section
          title={t('scheduleTitle')}
          titleSize="3xl"
          className="py-10"
          titleTrailing={scheduleArrows}
        />

        <DatePicker
          label={t('scheduleDate')}
          value={selectedDate}
          onChange={setSelectedDate}
          containerClassName="mb-4"
        />

        <CardScroller className="mb-4">
          <Chip
            size="lg"
            label={t('scheduleAll')}
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
          <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
            {t('commonLoading')}
          </ThemedText>
        ) : filteredEmployees.length === 0 ? (
          <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
            No employees with a shift on this date{selectedBranchId ? ' at this branch' : ''}.
          </ThemedText>
        ) : (
          <Grid columns={2} spacing={10}>
            {filteredEmployees.map((emp) => {
              const branchNames = getBranchNamesForDate(
                emp,
                selectedDate,
                branches,
                selectedBranchId
              );
              return (
                <Pressable
                  key={emp.id}
                  onPress={() => {
                    setSelectedEmployee(emp);
                    employeeSheetRef.current?.show();
                  }}
                  className="active:opacity-90">
                  <ScheduleCard
                    name={emp.name}
                    image={emp.avatarUrl ?? require('@/assets/img/barbers.png')}
                    branchNames={branchNames}
                    dateVariant={dateVariant}
                  />
                </Pressable>
              );
            })}
          </Grid>
        )}
      </ThemedScroller>

      <ActionSheetThemed ref={employeeSheetRef} gestureEnabled>
        <View className="p-4 pb-8">
          <View className="gap-3">
            <Button
              title={t('scheduleRezervovat')}
              onPress={() => {}}
              variant="primary"
              className="w-full"
            />
            <Button
              title={t('scheduleProfil')}
              onPress={() => {
                employeeSheetRef.current?.hide();
                if (selectedEmployee)
                  router.push(`/screens/barber-detail?id=${selectedEmployee.id}`);
              }}
              variant="outline"
              className="w-full"
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
};

interface ScheduleCardProps {
  name: string;
  image: string | number;
  /** Pobočka/pobočky, na kterých má zaměstnanec směnu – zobrazíme jako indikátor na kartě. */
  branchNames: string[];
  /** Zelený (dnes) / oranžový (zítra) indikátor v rohu karty; null = nezobrazovat. */
  dateVariant: 'today' | 'tomorrow' | null;
}

const ScheduleCard = ({ name, image, branchNames, dateVariant }: ScheduleCardProps) => {
  return (
    <View
      style={{ ...shadowPresets.large }}
      className="overflow-hidden rounded-3xl bg-light-primary dark:bg-dark-secondary">
      <View className="aspect-[3/4] w-full bg-neutral-200 dark:bg-neutral-800">
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          className="h-full w-full"
          resizeMode="cover"
        />
        {dateVariant !== null && (
          <View className="absolute right-3 top-2">
            <LiveIndicator variant={dateVariant === 'tomorrow' ? 'orange' : 'green'} />
          </View>
        )}
        {branchNames.length > 0 && (
          <View className="absolute left-2 right-2 top-2 flex-row flex-wrap gap-1">
            {branchNames.map((branchName) => (
              <View
                key={branchName}
                className="rounded-full bg-black/50 px-2 py-1 dark:bg-white/20">
                <ThemedText className="text-[10px] font-medium text-white" numberOfLines={1}>
                  {branchName}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
      <View className="p-3">
        <ThemedText className="text-base font-semibold" numberOfLines={1}>
          {name}
        </ThemedText>
      </View>
    </View>
  );
};

export default ScheduleScreen;
