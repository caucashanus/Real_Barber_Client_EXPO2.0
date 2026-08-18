export type BookingHoldState = {
  holdId: string;
  expiresAt: string;
  branchId: string;
  itemId: string;
  employeeId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
};

export type BookingHoldDialogKind = 'expired' | 'unavailable';

export type BookingHoldCreateResult = 'ok' | 'conflict' | 'error';

export type BookingHoldApiHold = {
  holdId: string;
  expiresAt: string;
  ttlSeconds?: number;
  branchId: string;
  itemId: string;
  employeeId: string;
  date: string;
  slotStart: string;
  slotEnd: string;
};
