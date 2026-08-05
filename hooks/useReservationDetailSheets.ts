import { useCallback, useRef, useState } from 'react';
import { ActionSheetRef } from 'react-native-actions-sheet';

import type { Branch, BranchEmployee } from '@/api/branches';
import {
  branchDescription,
  employeeDescription,
  getBranchMedia,
  getEmployeeMedia,
} from '@/utils/reservationCreateHelpers';

interface UseReservationDetailSheetsParams {
  branches: Branch[];
  employeesAll: BranchEmployee[];
  selectBranchId: (branchId: string) => void;
  selectEmployee: (employeeId: string) => void;
}

export function useReservationDetailSheets({
  branches,
  employeesAll,
  selectBranchId,
  selectEmployee,
}: UseReservationDetailSheetsParams) {
  const [detailsEmployeeId, setDetailsEmployeeId] = useState<string | null>(null);
  const detailsSheetRef = useRef<ActionSheetRef>(null);
  const [detailsBranchId, setDetailsBranchId] = useState<string | null>(null);
  const branchDetailsSheetRef = useRef<ActionSheetRef>(null);
  const [isBranchDescriptionExpanded, setIsBranchDescriptionExpanded] = useState(false);

  const detailsEmployee = employeesAll.find((e) => e.id === detailsEmployeeId) ?? null;
  const detailsDescription = detailsEmployee ? employeeDescription(detailsEmployee) : '';
  const detailsMedia = detailsEmployee
    ? getEmployeeMedia(detailsEmployee).filter((m) => m.type !== 'video')
    : [];
  const detailsBranch = branches.find((b) => b.id === detailsBranchId) ?? null;
  const detailsBranchDescription = detailsBranch ? branchDescription(detailsBranch) : '';
  const detailsBranchMedia = detailsBranch ? getBranchMedia(detailsBranch) : [];
  const detailsBranchImages = detailsBranchMedia.filter((m) => m.type !== 'video');
  const detailsBranchVideo = detailsBranchMedia.find((m) => m.type === 'video');

  const openEmployeeDetails = useCallback(
    (employeeId: string) => {
      selectEmployee(employeeId);
      setDetailsEmployeeId(employeeId);
      detailsSheetRef.current?.show();
    },
    [selectEmployee]
  );

  const openBranchDetails = useCallback(
    (branchId: string) => {
      selectBranchId(branchId);
      setDetailsBranchId(branchId);
      setIsBranchDescriptionExpanded(false);
      branchDetailsSheetRef.current?.show();
    },
    [selectBranchId]
  );

  const closeEmployeeDetails = useCallback(() => {
    detailsSheetRef.current?.hide();
  }, []);

  const closeBranchDetails = useCallback(() => {
    branchDetailsSheetRef.current?.hide();
  }, []);

  return {
    detailsSheetRef,
    detailsEmployee,
    detailsDescription,
    detailsMedia,
    detailsBranch,
    detailsBranchDescription,
    isBranchDescriptionExpanded,
    setIsBranchDescriptionExpanded,
    detailsBranchVideo,
    detailsBranchImages,
    branchDetailsSheetRef,
    openEmployeeDetails,
    openBranchDetails,
    closeEmployeeDetails,
    closeBranchDetails,
  };
}
