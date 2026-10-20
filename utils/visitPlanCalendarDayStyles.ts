import type { ViewStyle } from 'react-native';

/** Brand accent — kalendář plán návštěv (NativeWind `bg-accent/*` na buňkách často nefunguje). */
export const VISIT_PLAN_CALENDAR_ACCENT = '#FF4F31';

export const VISIT_PLAN_CONFIRMED_DAY_STYLE: ViewStyle = {
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  borderWidth: 1.5,
  borderColor: 'rgba(34, 197, 94, 0.55)',
  borderRadius: 12,
};

export const VISIT_PLAN_IDEAL_CENTER_DAY_STYLE: ViewStyle = {
  backgroundColor: VISIT_PLAN_CALENDAR_ACCENT,
  borderRadius: 12,
};

export const VISIT_PLAN_IDEAL_NEIGHBOR_DAY_STYLE: ViewStyle = {
  backgroundColor: 'rgba(255, 79, 49, 0.15)',
  borderWidth: 1,
  borderColor: 'rgba(255, 79, 49, 0.45)',
  borderRadius: 12,
};

const LEGEND_SWATCH_SIZE = 12;

export const VISIT_PLAN_CONFIRMED_LEGEND_SWATCH: ViewStyle = {
  width: LEGEND_SWATCH_SIZE,
  height: LEGEND_SWATCH_SIZE,
  borderRadius: 4,
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  borderWidth: 1.5,
  borderColor: 'rgba(34, 197, 94, 0.55)',
};

/** Stejný tvar jako zelená legenda — zaoblený čtvereček, ne kolečko. */
export const VISIT_PLAN_RECOMMENDED_LEGEND_SWATCH: ViewStyle = {
  width: LEGEND_SWATCH_SIZE,
  height: LEGEND_SWATCH_SIZE,
  borderRadius: 4,
  backgroundColor: 'rgba(255, 79, 49, 0.2)',
  borderWidth: 1.5,
  borderColor: 'rgba(255, 79, 49, 0.55)',
};
