import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import BarberPicker from '@/components/BarberPicker';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { useAuth } from '@/app/contexts/AuthContext';
import { createClientCut } from '@/api/cuts';
import { getEmployees, type Employee } from '@/api/employees';

const MAX_PHOTOS = 5;

export default function HaircutAddScreen() {
  const { apiToken } = useAuth();
  const [photoUris, setPhotoUris] = useState<string[]>([]);
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
      Alert.alert('Oprávnění', 'Pro výběr fotek z galerie je potřeba povolit přístup k fotkám.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photoUris.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length) {
      const newUris = result.assets.map((a) => a.uri);
      setPhotoUris((prev) => [...prev, ...newUris].slice(0, MAX_PHOTOS));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Oprávnění', 'Pro pořízení fotky je potřeba povolit přístup k foťáku.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] && photoUris.length < MAX_PHOTOS) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!apiToken) return;
    const trimmedName = hairstyle.trim();
    if (!trimmedName) {
      setError('Název je povinný');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createClientCut(apiToken, {
        hairstyle: trimmedName,
        note: note.trim() || null,
        barber_id: barberId.trim() || null,
        // Fotky: API očekává media ID po nahrání na server. Zatím posíláme jen název a poznámku.
        // Po doplnění upload endpointu lze přidat photos: [...mediaIds].
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodařilo se uložit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="Přidat účes" showBackButton />
      <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
        <Section title="Fotky" titleSize="md" className="mt-2">
          <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-3">
            Přidej fotky účesu z galerie nebo foťákem (volitelné). Zatím se ukládá jen název a poznámka.
          </ThemedText>
          <View className="flex-row flex-wrap gap-3">
            {photoUris.map((uri, index) => (
              <View key={`${uri}-${index}`} className="relative">
                <Image source={{ uri }} className="w-20 h-20 rounded-xl bg-light-secondary dark:bg-dark-secondary" resizeMode="cover" />
                <Pressable
                  onPress={() => removePhoto(index)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                >
                  <Icon name="X" size={14} color="white" />
                </Pressable>
              </View>
            ))}
            {photoUris.length < MAX_PHOTOS && (
              <>
                <Pressable
                  onPress={pickFromGallery}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-light-secondary dark:border-dark-secondary items-center justify-center bg-light-secondary/50 dark:bg-dark-secondary/50"
                >
                  <Icon name="Image" size={28} className="text-light-subtext dark:text-dark-subtext" />
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Galerie</ThemedText>
                </Pressable>
                <Pressable
                  onPress={takePhoto}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-light-secondary dark:border-dark-secondary items-center justify-center bg-light-secondary/50 dark:bg-dark-secondary/50"
                >
                  <Icon name="Camera" size={28} className="text-light-subtext dark:text-dark-subtext" />
                  <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Foťák</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Section>

        <Section title="" titleSize="md" className="mt-2">
          <Input
            label="Název účesu"
            value={hairstyle}
            onChangeText={setHairstyle}
            placeholder="např. Low Fade, Undercut"
            containerClassName="mb-4"
          />
          <BarberPicker
            label="Kadeřník"
            employees={employees}
            value={barberId}
            onChange={setBarberId}
          />
          <Input
            label="Poznámka"
            value={note}
            onChangeText={setNote}
            placeholder="Volitelná poznámka"
            isMultiline
            containerClassName="mb-4"
          />
          {error ? (
            <ThemedText className="mb-3 text-red-500 dark:text-red-400">{error}</ThemedText>
          ) : null}
          <Button
            title={saving ? 'Ukládám…' : 'Uložit'}
            onPress={handleSave}
            disabled={saving}
          />
        </Section>
      </ThemedScroller>
    </>
  );
}
