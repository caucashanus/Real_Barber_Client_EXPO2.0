import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedFooter from '@/components/ThemeFooter';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import BarberPicker from '@/components/BarberPicker';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import AnimatedView from '@/components/AnimatedView';
import ImageCarousel from '@/components/ImageCarousel';
import Avatar from '@/components/Avatar';
import ShowRating from '@/components/ShowRating';
import ListLink from '@/components/ListLink';
import Divider from '@/components/layout/Divider';
import HaircutNoteSections from '@/components/HaircutNoteSections';
import Icon from '@/components/Icon';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSetTransferRecipient } from '@/app/contexts/TransferRecipientContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getClientCut, patchClientCut, deleteClientCut, type ClientCut } from '@/api/cuts';
import { deleteClientMedia, uploadClientMedia } from '@/api/client';
import { getEmployees, type Employee } from '@/api/employees';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');
/** Stejný limit jako ve wizardu `add-property`. */
const MAX_CUT_PHOTOS = 5;

/** Rozdělí `createdAt` na datum a čas pro dvousloupcovou kartu (jako check-in / check-out). */
function formatCutCreatedAtParts(iso: string | undefined): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' };
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  } catch {
    return { date: '—', time: '—' };
  }
}

export default function HaircutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const setTransferRecipient = useSetTransferRecipient();
  const heroScrollY = useRef(new Animated.Value(0)).current;

  const [cut, setCut] = useState<ClientCut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftHairstyle, setDraftHairstyle] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [draftBarberId, setDraftBarberId] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

  const syncDraftsFromCut = useCallback(() => {
    if (!cut) return;
    setDraftHairstyle(cut.hairstyle ?? '');
    setDraftNote(cut.note ?? '');
    setDraftBarberId(cut.barber?.id ?? '');
  }, [cut]);

  useEffect(() => {
    if (!editing) syncDraftsFromCut();
  }, [cut, editing, syncDraftsFromCut]);

  const carouselImages = useMemo(() => {
    if (!cut) return [PLACEHOLDER_IMAGE];
    const urls = cut.photos?.map((p) => p.media?.url).filter(Boolean) as string[];
    if (urls.length > 0) return urls;
    return [PLACEHOLDER_IMAGE];
  }, [cut]);

  const haircutPhotoUrls = useMemo(() => {
    if (!cut?.photos?.length) return [];
    return [...cut.photos]
      .sort((a, b) => a.order - b.order)
      .map((p) => p.media?.url)
      .filter(Boolean) as string[];
  }, [cut]);

  const sortedCutPhotos = useMemo(() => {
    if (!cut?.photos?.length) return [];
    return [...cut.photos].sort((a, b) => a.order - b.order);
  }, [cut]);

  const patchFieldsForPhotos = useCallback(() => {
    if (!cut) {
      return {
        hairstyle: '',
        note: null as string | null,
        barber_id: null as string | null,
      };
    }
    const hairstyle = (editing ? draftHairstyle : cut.hairstyle).trim();
    const noteRaw = editing ? draftNote : (cut.note ?? '');
    const barberRaw = editing ? draftBarberId : (cut.barber?.id ?? '');
    return {
      hairstyle,
      note: noteRaw.trim() || null,
      barber_id: barberRaw.trim() || null,
    };
  }, [cut, editing, draftHairstyle, draftNote, draftBarberId]);

  const appendPhotosFromAssets = useCallback(
    async (assets: ImagePickerAsset[]) => {
      if (!apiToken || !id || !cut || assets.length === 0) return;
      const remaining = MAX_CUT_PHOTOS - cut.photos.length;
      const slice = assets.slice(0, Math.max(0, remaining));
      if (slice.length === 0) return;
      setUploadingPhotos(true);
      try {
        const pf = patchFieldsForPhotos();
        const label = pf.hairstyle || t('haircutTitle');
        const mediaIds = [...cut.photos]
          .sort((a, b) => a.order - b.order)
          .map((p) => p.media?.id)
          .filter(Boolean) as string[];
        for (const asset of slice) {
          const uploaded = await uploadClientMedia(apiToken, {
            uri: asset.uri,
            name: asset.fileName ?? undefined,
            mimeType: asset.mimeType ?? undefined,
            title: label,
            alt: label,
          });
          mediaIds.push(uploaded.id);
        }
        const updated = await patchClientCut(apiToken, id, {
          hairstyle: pf.hairstyle,
          note: pf.note,
          barber_id: pf.barber_id,
          photos: mediaIds,
        });
        setCut(updated);
      } catch (e) {
        Alert.alert('', e instanceof Error ? e.message : t('haircutDetailPhotoUploadFailed'));
      } finally {
        setUploadingPhotos(false);
      }
    },
    [apiToken, id, cut, t, patchFieldsForPhotos]
  );

  const removePhotoAt = useCallback(
    async (photoIndex: number) => {
      if (!apiToken || !id || !cut) return;
      const sorted = [...cut.photos].sort((a, b) => a.order - b.order);
      const mediaId = sorted[photoIndex]?.media?.id;
      if (!mediaId) return;
      setUploadingPhotos(true);
      try {
        await deleteClientMedia(apiToken, mediaId);
        const updated = await getClientCut(apiToken, id);
        setCut(updated);
      } catch (e) {
        Alert.alert('', e instanceof Error ? e.message : t('haircutDetailPhotoUploadFailed'));
      } finally {
        setUploadingPhotos(false);
      }
    },
    [apiToken, id, cut, t]
  );

  const pickImagesForCut = useCallback(async () => {
    if (!cut || uploadingPhotos || cut.photos.length >= MAX_CUT_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: MAX_CUT_PHOTOS - cut.photos.length,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length) {
      await appendPhotosFromAssets(result.assets);
    }
  }, [cut, uploadingPhotos, appendPhotosFromAssets]);

  const takePhotoForCut = useCallback(async () => {
    if (!cut || uploadingPhotos || cut.photos.length >= MAX_CUT_PHOTOS) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await appendPhotosFromAssets([result.assets[0]]);
    }
  }, [cut, uploadingPhotos, appendPhotosFromAssets]);

  const handleSave = async () => {
    if (!apiToken || !id) return;
    const trimmedName = draftHairstyle.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await patchClientCut(apiToken, id, {
        hairstyle: trimmedName,
        note: draftNote.trim() || null,
        barber_id: draftBarberId.trim() || null,
      });
      setCut(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
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

  const barberName = cut.barber?.name ?? '—';
  const barberAvatar = cut.barber?.avatarUrl ?? undefined;
  const createdParts = formatCutCreatedAtParts(cut.createdAt);

  const headerTitle = editing
    ? draftHairstyle.trim() || t('haircutTitle')
    : cut.hairstyle || t('haircutTitle');

  return (
    <>
      <Header title={headerTitle} showBackButton />
      <ThemedScroller
        className="flex-1 px-0"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: heroScrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        <AnimatedView animation="fadeIn" duration={400} delay={100}>
          <View className="px-global">
            <ImageCarousel
              height={300}
              rounded="2xl"
              images={carouselImages}
              scrollY={heroScrollY}
              stretchOnPullDown
            />
          </View>

          <View className="px-global pt-6 pb-4">
            {editing ? (
              <>
                <Input
                  label={t('haircutName')}
                  value={draftHairstyle}
                  onChangeText={setDraftHairstyle}
                  placeholder="e.g. Low Fade"
                  containerClassName="mb-2"
                />
                {error ? (
                  <ThemedText className="mb-2 text-red-500 dark:text-red-400">{error}</ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText className="text-2xl font-bold">{cut.hairstyle || t('haircutTitle')}</ThemedText>
            )}
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('haircutDetailCreatedWith')} titleSize="lg" className="px-global pt-4">
            {editing ? (
              <BarberPicker
                label={t('haircutBarber')}
                employees={employees}
                value={draftBarberId}
                onChange={setDraftBarberId}
              />
            ) : (
              <>
                <View className="flex-row items-center justify-between mt-4 mb-4">
                  <View className="flex-row items-center flex-1">
                    <Avatar src={barberAvatar ?? PLACEHOLDER_IMAGE} size="lg" name={barberName !== '—' ? barberName : undefined} />
                    <View className="ml-3 flex-1">
                      <ThemedText className="text-lg font-semibold">{barberName}</ThemedText>
                      <View className="flex-row items-center mt-px">
                        <ShowRating rating={5} size="sm" />
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext ml-2">(0 reviews)</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {cut.barber?.id ? (
                  <ListLink
                    icon="Gift"
                    title={t('bookingSendRbcTip')}
                    description={t('bookingSendRbcTip')}
                    showChevron
                    className="rounded-xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary"
                    onPress={() => {
                      const barber = cut.barber;
                      if (!barber?.id) return;
                      setTransferRecipient({
                        id: barber.id,
                        name: barber.name ?? '—',
                        type: 'EMPLOYEE',
                        avatarUrl: barber.avatarUrl ?? undefined,
                      });
                      router.push(`/screens/transfer-chat/${encodeURIComponent(barber.id)}`);
                    }}
                  />
                ) : null}
              </>
            )}
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('haircutDetailCreatedAtPrefix')} titleSize="lg" className="px-global pt-4">
            <View className="mt-4">
              <View className="flex-row items-center justify-between bg-light-secondary dark:bg-dark-secondary rounded-xl p-4">
                <View>
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('haircutDetailCreatedDateLabel')}
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{createdParts.date}</ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                    {t('haircutDetailCreatedTimeLabel')}
                  </ThemedText>
                  <ThemedText className="text-lg font-semibold">{createdParts.time}</ThemedText>
                </View>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <HaircutNoteSections
            note={editing ? draftNote : cut.note}
            editing={editing}
            onNoteChange={setDraftNote}
          />

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('haircutDetailPhotosSection')}
            titleSize="lg"
            titleAlign="right"
            className="px-global pt-4 pb-6"
          >
            <View className="mt-4">
              {haircutPhotoUrls.length === 0 ? (
                <ThemedText className="mb-3 text-center text-sm text-light-subtext dark:text-dark-subtext">
                  {t('haircutDetailPhotosEmpty')}
                </ThemedText>
              ) : null}

              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                className={uploadingPhotos ? 'opacity-50' : ''}
              >
                <View className="flex-row items-stretch gap-3 pb-1 pr-2">
                  {editing
                    ? sortedCutPhotos.map((p, index) => {
                        const uri = p.media?.url;
                        if (!uri) return null;
                        return (
                          <View key={p.id} className="relative h-44 w-36 shrink-0">
                            <Image
                              source={{ uri }}
                              className="h-44 w-36 rounded-xl bg-light-secondary dark:bg-dark-secondary"
                              resizeMode="cover"
                            />
                            <Pressable
                              onPress={() => removePhotoAt(index)}
                              disabled={uploadingPhotos}
                              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 items-center justify-center"
                            >
                              <Icon name="X" size={14} color="white" />
                            </Pressable>
                          </View>
                        );
                      })
                    : haircutPhotoUrls.map((uri, index) => (
                        <Image
                          key={`${uri}-${index}`}
                          source={{ uri }}
                          className="h-44 w-36 shrink-0 rounded-xl bg-light-secondary dark:bg-dark-secondary"
                          resizeMode="cover"
                        />
                      ))}

                  {cut.photos.length < MAX_CUT_PHOTOS ? (
                    <View className="shrink-0 flex-row gap-3">
                      <TouchableOpacity
                        disabled={uploadingPhotos}
                        onPress={pickImagesForCut}
                        className="h-44 w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-light-subtext dark:border-dark-subtext"
                      >
                        <Icon name="Plus" size={24} className="text-light-subtext dark:text-dark-subtext" />
                        <ThemedText className="mt-1 px-1 text-center text-xs text-light-subtext dark:text-dark-subtext">
                          {t('addPropertyAddPhoto')}
                        </ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={uploadingPhotos}
                        onPress={takePhotoForCut}
                        className="h-44 w-36 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-light-subtext dark:border-dark-subtext"
                      >
                        <Icon name="Plus" size={24} className="text-light-subtext dark:text-dark-subtext" />
                        <ThemedText className="mt-1 px-1 text-center text-xs text-light-subtext dark:text-dark-subtext">
                          {t('addPropertyTakePhoto')}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <ThemedFooter>
        {editing ? (
          <View className="flex-row gap-3">
            <Button title={t('commonCancel')} variant="outline" className="flex-1" onPress={cancelEdit} />
            <Button
              title={saving ? 'Saving…' : t('commonSave')}
              variant="primary"
              textClassName="text-white"
              className="flex-1"
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        ) : (
          <View className="flex-row gap-3">
            <Button
              title={t('commonDelete')}
              variant="outline"
              iconStart="X"
              className="flex-1"
              onPress={handleDelete}
            />
            <Button
              title={t('commonEdit')}
              variant="primary"
              iconStart="UserRoundPen"
              className="flex-1 min-w-0"
              onPress={() => {
                syncDraftsFromCut();
                setEditing(true);
              }}
            />
          </View>
        )}
      </ThemedFooter>
    </>
  );
}
