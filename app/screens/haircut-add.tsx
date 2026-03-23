import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { router } from 'expo-router';
import { uploadClientMedia } from '@/api/client';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import BarberPicker from '@/components/BarberPicker';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { createClientCut } from '@/api/cuts';
import { getEmployees, type Employee } from '@/api/employees';

const MAX_PHOTOS = 5;

export default function HaircutAddScreen() {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const [photoAssets, setPhotoAssets] = useState<ImagePickerAsset[]>([]);
  const [hairstyle, setHairstyle] = useState('');
  const [note, setNote] = useState('');
  const [barberId, setBarberId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiToken) return;
    getEmployees(apiToken)
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, [apiToken]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'To pick photos from the gallery you need to allow access to photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoAssets.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length) {
      setPhotoAssets((prev) => [...prev, ...result.assets].slice(0, MAX_PHOTOS));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'To take a photo you need to allow access to the camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] && photoAssets.length < MAX_PHOTOS) {
      setPhotoAssets((prev) => [...prev, result.assets[0]].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotoAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!apiToken) return;
    const trimmedName = hairstyle.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const photoIds: string[] = [];
      for (const asset of photoAssets) {
        const uploaded = await uploadClientMedia(apiToken, {
          uri: asset.uri,
          name: asset.fileName ?? undefined,
          mimeType: asset.mimeType ?? undefined,
          title: trimmedName,
          alt: trimmedName,
        });
        photoIds.push(uploaded.id);
      }

      await createClientCut(apiToken, {
        hairstyle: trimmedName,
        note: note.trim() || null,
        barber_id: barberId.trim() || null,
        photos: photoIds,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title={t('haircutAdd')} showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section title={t('haircutPhotos')} titleSize="md" className="mt-2">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-3">
            {t('haircutPhotosHint')}
          </ThemedText>
          <View className="flex-row flex-wrap gap-3">
            {photoAssets.map((asset, index) => (
              <View key={`${asset.uri}-${index}`} className="relative">
                <Image source={{ uri: asset.uri }} className="w-20 h-20 rounded-xl bg-light-secondary dark:bg-dark-secondary" resizeMode="cover" />
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                >
                  <Icon name="X" size={14} color="white" />
                </Pressable>
              </View>
            ))}
            {photoAssets.length < MAX_PHOTOS && (
              <>
                <Pressable
                  onPress={pickFromGallery}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-light-secondary dark:border-dark-secondary items-center justify-center bg-light-secondary/50 dark:bg-dark-secondary/50"
                >
                  <Icon name="Image" size={28} className="text-light-subtext dark:text-dark-subtext" />
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Gallery</ThemedText>
                </Pressable>
                <Pressable
                  onPress={takePhoto}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-light-secondary dark:border-dark-secondary items-center justify-center bg-light-secondary/50 dark:bg-dark-secondary/50"
                >
                  <Icon name="Camera" size={28} className="text-light-subtext dark:text-dark-subtext" />
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Camera</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Section>

        <Section title="" titleSize="md" className="mt-2">
          <Input
            label={t('haircutNameLabel')}
            value={hairstyle}
            onChangeText={setHairstyle}
            placeholder="e.g. Low Fade, Undercut"
            containerClassName="mb-4"
          />
          <BarberPicker
            label={t('haircutBarber')}
            employees={employees}
            value={barberId}
            onChange={setBarberId}
          />
          <Input
            label={t('haircutNote')}
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            isMultiline
            containerClassName="mb-4"
          />
          {error ? (
            <ThemedText className="mb-3 text-red-500 dark:text-red-400">{error}</ThemedText>
          ) : null}
          <Button
            title={saving ? 'Saving…' : 'Save'}
            onPress={handleSave}
            disabled={saving}
          />
        </Section>
      </ThemedScroller>
    </>
  );
}
