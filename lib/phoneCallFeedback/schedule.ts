type ScheduleFn = (() => void) | null;

let scheduleFn: ScheduleFn = null;

export function registerPhoneCallFeedbackScheduler(fn: ScheduleFn): void {
  scheduleFn = fn;
}

/** Volat po tapnutí na tel: operátora — otevře feedback drawer po návratu nebo ~3 s. */
export function schedulePhoneCallFeedbackAfterOperatorCall(): void {
  scheduleFn?.();
}
