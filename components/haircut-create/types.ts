import type { ImagePickerAsset } from 'expo-image-picker';

import type { HaircutWizardPropertyData } from '@/utils/haircut-note-build';

export interface PropertyData extends HaircutWizardPropertyData {
  photoAssets: ImagePickerAsset[];
}

export interface HaircutStepProps {
  data: PropertyData;
  updateData: (updates: Partial<PropertyData>) => void;
}
