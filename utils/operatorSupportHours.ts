function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

const WEEKDAY_START = toMinutes(8, 30);
const WEEKDAY_END = toMinutes(21, 30);
const WEEKEND_START = toMinutes(9, 30);
const WEEKEND_END = toMinutes(18, 30);

/** Po–Pá 8:30–21:30, So–Ne 9:30–18:30 (lokální čas zařízení). */
export function isOperatorSupportAvailable(date = new Date()): boolean {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (day >= 1 && day <= 5) {
    return minutes >= WEEKDAY_START && minutes <= WEEKDAY_END;
  }

  if (day === 0 || day === 6) {
    return minutes >= WEEKEND_START && minutes <= WEEKEND_END;
  }

  return false;
}
