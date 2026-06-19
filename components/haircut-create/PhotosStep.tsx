import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { useTranslation } from '@/app/hooks/useTranslation';
import Icon from '@/components/Icon';
import ThemedText from '@/components/ThemedText';
import { MAX_CUT_PHOTOS } from '@/components/haircut-create/constants';
import type { HaircutStepProps } from '@/components/haircut-create/types';
import Grid from '@/components/layout/Grid';

export default function PhotosStep({ data, updateData }: HaircutStepProps) {
  const { t } = useTranslation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: MAX_CUT_PHOTOS - data.photoAssets.length,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length) {
      const next = [...data.photoAssets, ...result.assets].slice(0, MAX_CUT_PHOTOS);
      updateData({ photoAssets: next });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    if (data.photoAssets.length >= MAX_CUT_PHOTOS) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      updateData({ photoAssets: [...data.photoAssets, result.assets[0]].slice(0, MAX_CUT_PHOTOS) });
    }
  };

  const removePhoto = (index: number) => {
    updateData({ photoAssets: data.photoAssets.filter((_, i) => i !== index) });
  };

  return (
    <ScrollView className="p-4 px-8">
      <View className="mb-10">
        <ThemedText variant="h1" className="mt-auto">
          {t('haircutCreateAddPhotos')}
        </ThemedText>
        <ThemedText className="text-base text-light-subtext dark:text-dark-subtext">
          {t('haircutCreateAtLeastOnePhoto')}
        </ThemedText>
      </View>

      <Grid columns={2} spacing={10}>
        {data.photoAssets.map((asset, index) => (
          <View key={`${asset.uri}-${index}`} className="relative h-44 w-full    ">
            <Image
              source={{ uri: asset.uri }}
              className="h-44 w-full rounded-lg"
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500">
              <Icon name="X" size={12} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </Grid>

      {data.photoAssets.length < MAX_CUT_PHOTOS ? (
        <View className={`w-full flex-row gap-3 ${data.photoAssets.length > 0 ? 'mt-3' : 'mt-0'}`}>
          <TouchableOpacity
            onPress={pickImage}
            className="h-32 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-light-subtext px-1 py-2 dark:border-dark-subtext">
            <Icon name="Plus" size={22} className="text-light-subtext dark:text-dark-subtext" />
            <ThemedText
              className="mt-1 text-center text-xs text-light-subtext dark:text-dark-subtext"
              numberOfLines={2}>
              {t('haircutCreateAddPhoto')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePhoto}
            className="h-32 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-light-subtext px-1 py-2 dark:border-dark-subtext">
            <Icon name="Plus" size={22} className="text-light-subtext dark:text-dark-subtext" />
            <ThemedText
              className="mt-1 text-center text-xs text-light-subtext dark:text-dark-subtext"
              numberOfLines={2}>
              {t('haircutCreateTakePhoto')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
