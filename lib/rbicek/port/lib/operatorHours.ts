/**
 * Live operator hours for Real Barber (Europe/Prague).
 * Po-Pa 8:30-21:30, So-Ne 9:30-18:30.
 */

export type DayHours = { from: string; to: string } | null;

/** Index 0 = Sunday … 6 = Saturday (Date.getDay). */
export const OPERATOR_HOURS_WEEK: DayHours[] = [
  { from: "09:30", to: "18:30" },
  { from: "08:30", to: "21:30" },
  { from: "08:30", to: "21:30" },
  { from: "08:30", to: "21:30" },
  { from: "08:30", to: "21:30" },
  { from: "08:30", to: "21:30" },
  { from: "09:30", to: "18:30" },
];

export const OPERATOR_HOURS_TIMEZONE = "Europe/Prague";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isOperatorOffHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATOR_HOURS_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const at = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const dayIndex = WEEKDAYS.indexOf(at("weekday"));
  const day = OPERATOR_HOURS_WEEK[dayIndex] ?? null;
  if (!day) return true;

  const local = `${at("hour")}:${at("minute")}`;
  return day.from <= day.to
    ? local < day.from || local >= day.to
    : local < day.from && local >= day.to;
}

export function operatorHoursLabel(): string {
  return "Po-Pa 8:30-21:30, So-Ne 9:30-18:30";
}
