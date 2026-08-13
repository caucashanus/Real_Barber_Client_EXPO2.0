import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function phoneCallFeedbackUserAgent(): string {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
  return `RealBarberApp/${version} (${os} ${Platform.Version})`;
}
