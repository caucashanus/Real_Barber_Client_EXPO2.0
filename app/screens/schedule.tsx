import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getBranches, type Branch } from '@/api/branches';
import { getEmployeeById, getEmployees, type Employee, type EmployeeBranch } from '@/api/employees';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import { CardScroller } from '@/components/CardScroller';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import LiveIndicator from '@/components/LiveIndicator';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { DatePicker } from '@/components/forms/DatePicker';
import Grid from '@/components/layout/Grid';
import Section from '@/components/layout/Section';
import { CLIENT_APP_V1_ENABLED } from '@/constants/clientAppApi';
import { shadowPresets } from '@/utils/useShadow';

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

type WorkScheduleSlot = {
  validFrom?: string;
  validUntil?: string;
  branch?: { id: string; name: string };
  [key: string]: unknown;
};

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function hasShiftOnDate(emp: Employee, date: Date): boolean {
  const today = new Date();
  if (isSameCalendarDay(date, today) && typeof emp.hasShiftToday === 'boolean') {
    return emp.hasShiftToday;
  }

  const ws = emp.workSchedule as
    | { weeklySchedule?: Record<string, WorkScheduleSlot[]> }
    | undefined;
  const weekly = ws?.weeklySchedule;
  if (!weekly || typeof weekly !== 'object') return false;
  const dayKey = WEEKDAY_API_KEYS[date.getDay()];
  const slots = weekly[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return false;
  const dateStr = toIsoDate(date);
  for (const slot of slots) {
    const from = slot.validFrom ? slot.validFrom.slice(0, 10) : '';
    const until = slot.validUntil ? slot.validUntil.slice(0, 10) : '';
    if (from && until && dateStr >= from && dateStr <= until) return true;
  }
  return false;
}

function getBranchNamesFromShiftsOnDate(emp: Employee, date: Date): string[] {
  const ws = emp.workSchedule as
    | { weeklySchedule?: Record<string, WorkScheduleSlot[]> }
    | undefined;
  const weekly = ws?.weeklySchedule;
  if (!weekly || typeof weekly !== 'object') return [];
  const dayKey = WEEKDAY_API_KEYS[date.getDay()];
  const slots = weekly[dayKey];
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const dateStr = toIsoDate(date);
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
  if (Array.isArray(emp.branchIds) && emp.branchIds.length > 0) {
    return emp.branchIds.filter((id): id is string => typeof id === 'string' && Boolean(id));
  }
  const b = emp.branches as EmployeeBranch[] | Record<string, EmployeeBranch> | undefined;
  if (!b) return [];
  if (Array.isArray(b)) return b.map((x) => x.id);
  return Object.values(b).map((x) => x.id);
}

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

function employeeNeedsScheduleDetail(emp: Employee): boolean {
  return !emp.workSchedule;
}

async function enrichEmployeesWithSchedule(
  apiToken: string,
  employees: Employee[]
): Promise<Employee[]> {
  if (!CLIENT_APP_V1_ENABLED) return employees;
  const needsDetail = employees.filter(employeeNeedsScheduleDetail);
  if (needsDetail.length === 0) return employees;

  const detailById = new Map<string, Employee>();
  await Promise.all(
    needsDetail.map((emp) =>
      getEmployeeById(apiToken, emp.id)
        .then((detail) => {
          detailById.set(emp.id, detail);
        })
        .catch(() => {})
    )
  );

  return employees.map((emp) => {
    const detail = detailById.get(emp.id);
    if (!detail) return emp;
    return {
      ...emp,
      workSchedule: detail.workSchedule ?? emp.workSchedule,
      branches: detail.branches ?? emp.branches,
      branchIds: detail.branchIds ?? emp.branchIds,
      hasShiftToday: detail.hasShiftToday ?? emp.hasShiftToday,
    };
  });
}

export default function ScheduleScreen() {
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
    let cancelled = false;
    setLoading(true);
    Promise.all([getEmployees(apiToken, {}), getBranches(apiToken, {})])
      .then(async ([empList, branchList]) => {
        const list = (Array.isArray(empList) ? empList : Object.values(empList)) as Employee[];
        const enriched = await enrichEmployeesWithSchedule(apiToken, list);
        if (cancelled) return;
        setEmployees(enriched);
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch(() => {
        if (!cancelled) {
          setEmployees([]);
          setBranches([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiToken]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!hasShiftOnDate(emp, selectedDate)) return false;
      if (selectedBranchId === null) return true;
      return getEmployeeBranchIds(emp).includes(selectedBranchId);
    });
  }, [employees, selectedDate, selectedBranchId]);

  const isToday = useMemo(() => isSameCalendarDay(selectedDate, new Date()), [selectedDate]);

  const isTomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isSameCalendarDay(selectedDate, d);
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
      <ThemedScroller className="flex-1 px-global" keyboardShouldPersistTaps="handled">
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
          <View className="items-center py-10">
            <ActivityIndicator size="small" />
          </View>
        ) : filteredEmployees.length === 0 ? (
          <ThemedText className="py-4 text-light-subtext dark:text-dark-subtext">
            {selectedBranchId ? t('scheduleEmptyBranch') : t('scheduleEmpty')}
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
              onPress={() => {
                employeeSheetRef.current?.hide();
                if (selectedEmployee) {
                  router.push(
                    `/screens/reservation-create?employeeId=${encodeURIComponent(selectedEmployee.id)}` as any
                  );
                }
              }}
              variant="primary"
              className="w-full"
            />
            <Button
              title={t('scheduleProfil')}
              onPress={() => {
                employeeSheetRef.current?.hide();
                if (selectedEmployee) {
                  router.push(`/screens/barber-detail?id=${selectedEmployee.id}`);
                }
              }}
              variant="outline"
              className="w-full"
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
}

interface ScheduleCardProps {
  name: string;
  image: string | number;
  branchNames: string[];
  dateVariant: 'today' | 'tomorrow' | null;
}

function ScheduleCard({ name, image, branchNames, dateVariant }: ScheduleCardProps) {
  return (
    <View
      style={{ ...shadowPresets.large }}
      className="overflow-hidden rounded-3xl bg-light-primary dark:bg-dark-secondary">
      <View className="aspect-[3/4] w-full bg-neutral-200 dark:bg-neutral-800">
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          className="h-full w-full"
          contentFit="cover"
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
}
