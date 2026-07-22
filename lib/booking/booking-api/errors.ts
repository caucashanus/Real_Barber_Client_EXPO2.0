export class BookingApiError extends Error {
  status: number;
  body: unknown;
  retryAfter?: number;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'BookingApiError';
    this.status = status;
    this.body = body;
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record.retryAfter === 'number') {
        this.retryAfter = record.retryAfter;
      }
    }
  }
}

export function isBookingSlotConflict(err: unknown): boolean {
  return err instanceof BookingApiError && err.status === 409;
}

export function isBookingRateLimited(err: unknown): boolean {
  return err instanceof BookingApiError && err.status === 429;
}
