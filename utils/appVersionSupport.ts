import Constants from 'expo-constants';

export function getInstalledNativeAppVersion(): string {
  return (
    Constants.nativeAppVersion?.trim() ||
    Constants.expoConfig?.version?.trim() ||
    '0.0.0'
  );
}
