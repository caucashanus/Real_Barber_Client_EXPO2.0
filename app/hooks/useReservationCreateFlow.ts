import { useState } from 'react';

import { useAuth } from '@/app/contexts/AuthContext';
import { useLanguage } from '@/app/contexts/LanguageContext';
import useThemeColors from '@/app/contexts/ThemeColors';
import { useReservationAvailability } from '@/app/hooks/useReservationAvailability';
import { useReservationBootstrap } from '@/app/hooks/useReservationBootstrap';
import { useReservationCatalog } from '@/app/hooks/useReservationCatalog';
import { useReservationCoupon } from '@/app/hooks/useReservationCoupon';
import { useReservationDetailSheets } from '@/app/hooks/useReservationDetailSheets';
import { useReservationFlowNavigation } from '@/app/hooks/useReservationFlowNavigation';
import { useReservationSubmit } from '@/app/hooks/useReservationSubmit';
import { useReservationSummaryLabels } from '@/app/hooks/useReservationSummaryLabels';
import { useTranslation } from '@/app/hooks/useTranslation';
import { isReservationStepValid, type ReservationFlowData } from '@/utils/reservationCreateHelpers';

export function useReservationCreateFlow() {
  const { apiToken, client } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const colors = useThemeColors();

  const [data, setData] = useState<ReservationFlowData>({
    branchId: '',
    employeeId: '',
    itemId: '',
    date: '',
    slotStart: '',
    slotEnd: '',
    duration: 0,
  });
  const [monthOffset, setMonthOffset] = useState(0);
  const [lastSelectedDateByMonth, setLastSelectedDateByMonth] = useState<Record<string, string>>(
    {}
  );

  const sharedFlowState = { data, setData };
  const sharedMonthState = {
    monthOffset,
    setMonthOffset,
    lastSelectedDateByMonth,
    setLastSelectedDateByMonth,
  };

  const bootstrap = useReservationBootstrap({ apiToken, ...sharedFlowState, ...sharedMonthState });

  const catalog = useReservationCatalog({
    apiToken,
    branches: bootstrap.branches,
    employeesById: bootstrap.employeesById,
    presetEmployeeId: bootstrap.presetEmployeeId,
    presetItemId: bootstrap.presetItemId,
    presetBranchFilterIds: bootstrap.presetBranchFilterIds,
    barberEntryMode: bootstrap.barberEntryMode,
    t,
    ...sharedFlowState,
    ...sharedMonthState,
  });

  const availability = useReservationAvailability({
    apiToken,
    dateLocaleTag,
    ...sharedFlowState,
    ...sharedMonthState,
  });

  const coupon = useReservationCoupon({ apiToken, data, t });

  const submit = useReservationSubmit({
    apiToken,
    clientId: client?.id,
    data,
    couponCodeInput: coupon.couponCodeInput,
    couponPreview: coupon.couponPreview,
    selectedService: catalog.selectedService,
    selectedEmployee: catalog.selectedEmployee,
    branchForServiceStep: catalog.branchForServiceStep,
  });

  const navigation = useReservationFlowNavigation({
    ...sharedFlowState,
    ...sharedMonthState,
    branches: bootstrap.branches,
    branchServicesSource: catalog.branchServicesSource,
    presetEmployeeId: bootstrap.presetEmployeeId,
    presetBranchId: bootstrap.presetBranchId,
    presetItemId: bootstrap.presetItemId,
    barberEntryMode: bootstrap.barberEntryMode,
    initialMultiStepIndex: bootstrap.initialMultiStepIndex,
  });

  const detailSheets = useReservationDetailSheets({
    branches: bootstrap.branches,
    employeesAll: catalog.employeesAll,
    selectBranchId: catalog.selectBranchId,
    selectEmployee: catalog.selectEmployee,
  });

  const summary = useReservationSummaryLabels({
    data,
    dateLocaleTag,
    selectedEmployee: catalog.selectedEmployee,
    selectedService: catalog.selectedService,
    presetItemName: bootstrap.presetItemName,
    presetItemId: bootstrap.presetItemId,
    branchForServiceStep: catalog.branchForServiceStep,
  });

  return {
    t,
    colors,
    dateLocaleTag,
    data,
    loadingBranches: bootstrap.loadingBranches,
    branchesForReservation: catalog.branchesForReservation,
    selectBranchId: catalog.selectBranchId,
    branchDetailsSheetRef: detailSheets.branchDetailsSheetRef,
    openBranchDetails: detailSheets.openBranchDetails,
    loadingBranchServicesFetch: catalog.loadingBranchServicesFetch,
    loadingAggregatedBranchServices: catalog.loadingAggregatedBranchServices,
    branchStepServiceOptions: catalog.branchStepServiceOptions,
    branchStepServiceCategories: catalog.branchStepServiceCategories,
    selectServiceOption: catalog.selectServiceOption,
    employeesDisplayOrder: catalog.employeesDisplayOrder,
    employees: catalog.employees,
    employeesNearestMap: catalog.employeesNearestMap,
    loadingEmployeesNearest: catalog.loadingEmployeesNearest,
    selectEmployee: catalog.selectEmployee,
    openEmployeeDetails: detailSheets.openEmployeeDetails,
    availableDatesInMonth: availability.availableDatesInMonth,
    loadingMonthAvailability: availability.loadingMonthAvailability,
    monthOffset,
    setMonthOffset,
    monthLabel: availability.monthLabel,
    showTodayChip: availability.showTodayChip,
    showTomorrowChip: availability.showTomorrowChip,
    todayIso: availability.todayIso,
    tomorrowIso: availability.tomorrowIso,
    visibleMonthDays: availability.visibleMonthDays,
    selectDate: availability.selectDate,
    groupedSlots: availability.groupedSlots,
    loadingAvailability: availability.loadingAvailability,
    availabilityError: availability.availabilityError,
    availability: availability.availability,
    selectAvailabilitySlot: availability.selectAvailabilitySlot,
    selectedEmployee: catalog.selectedEmployee,
    selectedEmployeeName: summary.selectedEmployeeName,
    selectedService: catalog.selectedService,
    selectedServiceName: summary.selectedServiceName,
    selectedDateLabel: summary.selectedDateLabel,
    branchForServiceStep: catalog.branchForServiceStep,
    summaryBranchCardImage: summary.summaryBranchCardImage,
    couponCodeInput: coupon.couponCodeInput,
    onCouponCodeChange: coupon.onCouponCodeChange,
    couponVerifying: coupon.couponVerifying,
    handleVerifyCoupon: coupon.handleVerifyCoupon,
    couponPreview: coupon.couponPreview,
    couponPreviewError: coupon.couponPreviewError,
    formatReservationPrice: summary.formatReservationPrice,
    creatingBooking: submit.creatingBooking,
    createBookingError: submit.createBookingError,
    handleCreateBooking: submit.handleCreateBooking,
    detailsSheetRef: detailSheets.detailsSheetRef,
    detailsEmployee: detailSheets.detailsEmployee,
    detailsDescription: detailSheets.detailsDescription,
    detailsMedia: detailSheets.detailsMedia,
    detailsBranch: detailSheets.detailsBranch,
    detailsBranchDescription: detailSheets.detailsBranchDescription,
    isBranchDescriptionExpanded: detailSheets.isBranchDescriptionExpanded,
    setIsBranchDescriptionExpanded: detailSheets.setIsBranchDescriptionExpanded,
    detailsBranchVideo: detailSheets.detailsBranchVideo,
    detailsBranchImages: detailSheets.detailsBranchImages,
    closeEmployeeDetails: detailSheets.closeEmployeeDetails,
    closeBranchDetails: detailSheets.closeBranchDetails,
    barberBootstrap: bootstrap.barberBootstrap,
    presetEmployeeId: bootstrap.presetEmployeeId,
    initialMultiStepIndex: bootstrap.initialMultiStepIndex,
    multiStepKey: navigation.multiStepKey,
    useFlowNextResolver: navigation.useFlowNextResolver,
    useFlowPrevResolver: navigation.useFlowPrevResolver,
    flowStepNextIndex: navigation.flowStepNextIndex,
    flowStepPrevIndex: navigation.flowStepPrevIndex,
    onStepIndexChange: navigation.onStepIndexChange,
    isNextDisabled: (stepIndex: number) => !isReservationStepValid(stepIndex, data),
  };
}

export type ReservationCreateFlow = ReturnType<typeof useReservationCreateFlow>;
