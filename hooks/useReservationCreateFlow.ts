import { useCallback, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useReservationAvailability } from '@/hooks/useReservationAvailability';
import { useReservationBootstrap } from '@/hooks/useReservationBootstrap';
import { useReservationCatalog } from '@/hooks/useReservationCatalog';
import { useReservationCoupon } from '@/hooks/useReservationCoupon';
import { useReservationDetailSheets } from '@/hooks/useReservationDetailSheets';
import { useReservationFlowNavigation } from '@/hooks/useReservationFlowNavigation';
import { useReservationSlotHandoff } from '@/hooks/useReservationSlotHandoff';
import { useReservationSubmit } from '@/hooks/useReservationSubmit';
import { useReservationSummaryLabels } from '@/hooks/useReservationSummaryLabels';
import { useTranslation } from '@/hooks/useTranslation';
import {
  isReservationStepValid,
  type ReservationFlowData,
  type ServiceOption,
} from '@/utils/reservationCreateHelpers';
import type { BookingSlotServiceItem } from '@/api/bookings';
import { intlLocaleTag } from '@/utils/intlLocaleTag';

function serviceOptionFromSlotService(service: BookingSlotServiceItem): ServiceOption {
  return {
    id: service.id,
    name: service.name,
    imageUrl: service.imageUrl,
    price: service.price ?? 0,
    duration: service.duration ?? 0,
    category: service.category,
  };
}

export function useReservationCreateFlow() {
  const { apiToken, client } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const dateLocaleTag = intlLocaleTag(locale);
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

  const slotHandoff = useReservationSlotHandoff({
    apiToken,
    client,
    barberEntryMode: bootstrap.barberEntryMode,
    presetEmployeeId: bootstrap.presetEmployeeId,
    dateLocaleTag,
    t,
    ...sharedFlowState,
  });

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

  const selectedSlotService = useMemo(
    () => slotHandoff.slotServices.find((service) => service.id === data.itemId) ?? null,
    [slotHandoff.slotServices, data.itemId]
  );

  const selectedService = catalog.selectedService ??
    (selectedSlotService ? serviceOptionFromSlotService(selectedSlotService) : null);

  const selectedEmployee = catalog.selectedEmployee ??
    (slotHandoff.handoff
      ? {
          id: slotHandoff.handoff.employeeId,
          name: slotHandoff.handoff.employeeName,
          avatarUrl: null,
        }
      : null);

  const submit = useReservationSubmit({
    apiToken,
    clientId: client?.id,
    data,
    couponCodeInput: coupon.couponCodeInput,
    couponPreview: coupon.couponPreview,
    selectedService,
    selectedEmployee,
    branchForServiceStep: catalog.branchForServiceStep,
    onBookingSuccess: slotHandoff.consumeHandoffAfterBooking,
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
    selectedEmployee,
    selectedService,
    presetItemName: bootstrap.presetItemName,
    presetItemId: bootstrap.presetItemId,
    branchForServiceStep: catalog.branchForServiceStep,
  });

  const getFooterTitle = useCallback(
    (stepIndex: number, isLastStep: boolean) => {
      if (slotHandoff.skipDatetime && stepIndex === 1 && !isLastStep) {
        return t('commonReserve');
      }
      return undefined;
    },
    [slotHandoff.skipDatetime, t]
  );

  const onFooterPrimaryPress = useCallback(
    (stepIndex: number, proceed: () => void) => {
      if (slotHandoff.skipDatetime && stepIndex === 1) {
        submit.handleCreateBooking();
        return;
      }
      proceed();
    },
    [slotHandoff.skipDatetime, submit.handleCreateBooking]
  );

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
    selectedEmployee,
    selectedEmployeeName: summary.selectedEmployeeName,
    selectedService,
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
    isSlotHandoffFlow: slotHandoff.isSlotHandoffFlow,
    slotHandoff: slotHandoff.handoff,
    slotServices: slotHandoff.slotServices,
    loadingSlotServices: slotHandoff.loadingSlotServices,
    slotServicesError: slotHandoff.slotServicesError,
    slotHandoffContextLabel: slotHandoff.slotHandoffContextLabel,
    slotHandoffSkipDatetime: slotHandoff.skipDatetime,
    selectSlotService: slotHandoff.selectSlotService,
    isServiceAvailableInHandoffSlot: slotHandoff.isServiceAvailableInHandoffSlot,
    selectedSlotServiceId: slotHandoff.selectedSlotServiceId,
    getFooterTitle,
    onFooterPrimaryPress,
  };
}

export type ReservationCreateFlow = ReturnType<typeof useReservationCreateFlow>;
