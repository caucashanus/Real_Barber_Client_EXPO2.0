import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';

type PickResult = ImagePickerAsset | null;

async function ensureGranted(
  req: () => Promise<ImagePicker.PermissionResponse>
): Promise<boolean> {
  const perm = await req();
  return perm.granted;
}

export async function pickSquareAvatarFromLibrary(): Promise<PickResult> {
  if (!(await ensureGranted(ImagePicker.requestMediaLibraryPermissionsAsync))) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  return result.canceled ? null : result.assets[0] ?? null;
}

export async function takeSquareAvatarPhoto(): Promise<PickResult> {
  if (!(await ensureGranted(ImagePicker.requestCameraPermissionsAsync))) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  return result.canceled ? null : result.assets[0] ?? null;
}

