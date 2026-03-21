import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import BarberPicker from '@/components/BarberPicker';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getClientCut, patchClientCut, deleteClientCut, type ClientCut } from '@/api/cuts';
import { getEmployees, type Employee } from '@/api/employees';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');

export default function HaircutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const [cut, setCut] = useState<ClientCut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [hairstyle, setHairstyle] = useState('');
  const [note, setNote] = useState('');
  const [barberId, setBarberId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadCut = useCallback(() => {
    if (!apiToken || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getClientCut(apiToken, id)
      .then((data) => {
        setCut(data);
        setHairstyle(data.hairstyle ?? '');
        setNote(data.note ?? '');
        setBarberId(data.barber?.id ?? '');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load haircut.');
        setCut(null);
      })
      .finally(() => setLoading(false));
  }, [apiToken, id]);

  useEffect(() => {
    loadCut();
  }, [loadCut]);

  useEffect(() => {
    if (!apiToken) return;
    getEmployees(apiToken)
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, [apiToken]);

  const handleSave = async () => {
    if (!apiToken || !id) return;
    const trimmedName = hairstyle.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await patchClientCut(apiToken, id, {
        hairstyle: trimmedName,
        note: note.trim() || null,
        barber_id: barberId.trim() || null,
      });
      setCut(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!apiToken || !id) return;
    Alert.alert(
      'Delete haircut',
      'Are you sure you want to delete this haircut? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClientCut(apiToken, id);
              router.back();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <>
        <Header title={t('haircutTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary">
          <ActivityIndicator size="large" />
          <ThemedText className="mt-2 text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
        </View>
      </>
    );
  }

  if (error && !cut) {
    return (
      <>
        <Header title={t('haircutTitle')} showBackButton />
        <View className="flex-1 items-center justify-center bg-light-primary dark:bg-dark-primary p-6">
          <ThemedText className="text-center text-red-500 dark:text-red-400">{error}</ThemedText>
        </View>
      </>
    );
  }

  if (!cut) return null;

  const imageSource = cut.photos?.[0]?.media?.url
    ? { uri: cut.photos[0].media.url }
    : PLACEHOLDER_IMAGE;

  return (
    <>
      <Header title={cut.hairstyle || t('haircutTitle')} showBackButton />
      <ThemedScroller className="flex-1">
        <AnimatedView animation="fadeIn" duration={300}>
          <View className="aspect-[4/3] w-full bg-light-secondary dark:bg-dark-secondary">
            <Image source={imageSource} className="w-full h-full" resizeMode="cover" />
          </View>

          {editing ? (
            <Section title="" titleSize="md" className="mt-4">
              <Input
                label={t('haircutName')}
                value={hairstyle}
                onChangeText={setHairstyle}
                placeholder="e.g. Low Fade"
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
                <ThemedText className="mb-2 text-red-500 dark:text-red-400">{error}</ThemedText>
              ) : null}
              <View className="flex-row gap-3">
                <Button
                  title={saving ? 'Saving…' : 'Save'}
                  onPress={handleSave}
                  disabled={saving}
                  className="flex-1"
                />
                <Button
                  title={t('commonCancel')}
                  variant="outline"
                  onPress={() => {
                    setEditing(false);
                    setHairstyle(cut.hairstyle ?? '');
                    setNote(cut.note ?? '');
                    setBarberId(cut.barber?.id ?? '');
                    setError(null);
                  }}
                  className="flex-1"
                />
              </View>
            </Section>
          ) : (
            <>
              <Section title="" titleSize="md" className="mt-4">
                <ThemedText className="text-lg font-medium text-light-primary dark:text-dark-primary">
                  {cut.hairstyle || 'Untitled'}
                </ThemedText>
                {cut.barber?.name ? (
                  <ThemedText className="mt-1 text-light-subtext dark:text-dark-subtext">
                    {cut.barber.name}
                  </ThemedText>
                ) : null}
                {cut.note ? (
                  <ThemedText className="mt-2 text-light-secondary dark:text-dark-secondary">
                    {cut.note}
                  </ThemedText>
                ) : null}
              </Section>
              <View className="p-global flex-row gap-3 mt-2">
                <Button title={t('commonEdit')} onPress={() => setEditing(true)} className="flex-1" />
                <Button title={t('commonDelete')} variant="outline" onPress={handleDelete} className="flex-1" />
              </View>
              {error ? (
                <ThemedText className="p-global text-red-500 dark:text-red-400">{error}</ThemedText>
              ) : null}
            </>
          )}
        </AnimatedView>
      </ThemedScroller>
    </>
  );
}
