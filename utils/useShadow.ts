import { Platform, ViewStyle } from 'react-native';

interface ShadowProps {
  elevation?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: {
    width: number;
    height: number;
  };
}

/**
 * Vrací konzistentní stíny pro iOS / Android (není to React hook — nepoužívej prefix `use`).
 */
export function getShadowStyle(options?: ShadowProps): ViewStyle {
  const {
    elevation = 5,
    shadowColor = '#000',
    shadowOpacity = 0.15,
    shadowRadius = 3.84,
    shadowOffset = {
      width: 0,
      height: 2,
    },
  } = options || {};

  const iosShadow: ViewStyle = {
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
  };

  const androidShadow: ViewStyle = {
    elevation,
  };

  return Platform.OS === 'ios' ? iosShadow : { ...iosShadow, ...androidShadow };
}

export const shadowPresets = {
  small: getShadowStyle({
    elevation: 3,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
  }),

  medium: getShadowStyle({
    elevation: 8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  }),

  large: getShadowStyle({
    elevation: 15,
    shadowRadius: 10.84,
    shadowOffset: { width: 0, height: 10 },
  }),

  card: getShadowStyle({
    elevation: 4,
    shadowRadius: 3.84,
    shadowOffset: { width: 0, height: 2 },
  }),
};

export default getShadowStyle;
