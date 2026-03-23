import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Alert, Animated } from 'react-native';
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
import { getEmployees, type Employee } from '@/api/employees';

const PLACEHOLDER_IMAGE = require('@/assets/img/barbers.png');

/** Stejné placeholdery jako v `booking-detail` — sekce později nahradíte reálnými daty střihu. */
const bookingData = {
  checkIn: 'Dec 20, 2025',
  checkOut: 'Dec 25, 2025',
  nights: 5,
  guests: 4,
  adults: 3,
  children: 1,
  infants: 0,
  pets: 0,
  requestDate: 'Dec 10, 2024',
  priceBreakdown: {
    nightlyRate: '$300',
    nights: 5,
    subtotal: '$1,500',
    cleaningFee: '$75',
    serviceFee: '$125',
    taxes: '$50',
    total: '$1,750',
  },
  paymentMethod: {
    type: 'Visa',
    lastFour: '1234',
  },
  specialRequests: [] as string[],
};

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

  const carouselImages = useMemo(() => {
    if (!cut) return [PLACEHOLDER_IMAGE];
    const urls = cut.photos?.map((p) => p.media?.url).filter(Boolean) as string[];
    if (urls.length > 0) return urls;
    return [PLACEHOLDER_IMAGE];
  }, [cut]);

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

  const cancelEdit = () => {
    if (!cut) return;
    setEditing(false);
    setHairstyle(cut.hairstyle ?? '');
    setNote(cut.note ?? '');
    setBarberId(cut.barber?.id ?? '');
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

  if (editing) {
    return (
      <>
        <Header title={cut.hairstyle || t('haircutTitle')} showBackButton />
        <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
          <AnimatedView animation="fadeIn" duration={300}>
            <Section title="" titleSize="md" className="mt-4 px-global">
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
            </Section>
          </AnimatedView>
        </ThemedScroller>
        <ThemedFooter>
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
        </ThemedFooter>
      </>
    );
  }

  const barberName = cut.barber?.name ?? '—';
  const barberAvatar = cut.barber?.avatarUrl ?? undefined;
  const createdParts = formatCutCreatedAtParts(cut.createdAt);

  return (
    <>
      <Header title={cut.hairstyle || t('haircutTitle')} showBackButton />
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
            <ThemedText className="text-2xl font-bold mb-2">{cut.hairstyle || t('haircutTitle')}</ThemedText>
            <View className="flex-row items-center">
              <Icon name="MapPin" size={16} className="mr-2 text-light-subtext dark:text-dark-subtext" />
              <ThemedText className="text-light-subtext dark:text-dark-subtext">{barberName}</ThemedText>
            </View>
          </View>

          <Divider className="h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section title={t('haircutDetailCreatedWith')} titleSize="lg" className="px-global pt-4">
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

          <HaircutNoteSections note={cut.note} />

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('bookingEarningsBreakdown')}
            titleSize="lg"
            titleAlign="right"
            className="px-global pt-4"
          >
            <View className="mt-4 gap-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">
                  {bookingData.priceBreakdown.nightlyRate} x {bookingData.priceBreakdown.nights} nights
                </ThemedText>
                <ThemedText>{bookingData.priceBreakdown.subtotal}</ThemedText>
              </View>

              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Cleaning fee</ThemedText>
                <ThemedText>{bookingData.priceBreakdown.cleaningFee}</ThemedText>
              </View>

              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Service fee (deducted)</ThemedText>
                <ThemedText className="text-red-600 dark:text-red-400">-{bookingData.priceBreakdown.serviceFee}</ThemedText>
              </View>

              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Taxes</ThemedText>
                <ThemedText>{bookingData.priceBreakdown.taxes}</ThemedText>
              </View>

              <Divider className="my-3" />

              <View className="flex-row justify-between">
                <ThemedText className="font-bold text-lg">Your earnings</ThemedText>
                <ThemedText className="font-bold text-lg text-green-600 dark:text-green-400">
                  $
                  {(
                    parseInt(bookingData.priceBreakdown.total.replace('$', '').replace(',', ''), 10) -
                    parseInt(bookingData.priceBreakdown.serviceFee.replace('$', ''), 10)
                  ).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('bookingPaymentMethod')}
            titleSize="lg"
            titleAlign="right"
            className="px-global pt-4"
          >
            <View className="flex-row items-center mt-4">
              <Icon name="CreditCard" size={20} className="mr-3" />
              <View>
                <ThemedText className="font-medium">
                  {bookingData.paymentMethod.type} •••• {bookingData.paymentMethod.lastFour}
                </ThemedText>
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
                  Payment will be processed upon approval
                </ThemedText>
              </View>
            </View>
          </Section>

          <Divider className="mt-6 h-2 bg-light-secondary dark:bg-dark-darker" />

          <Section
            title={t('bookingRequestDetails')}
            titleSize="lg"
            titleAlign="right"
            className="px-global pt-4 pb-6"
          >
            <View className="mt-4 gap-3">
              <View className="flex-row justify-between">
                <ThemedText className="text-light-subtext dark:text-dark-subtext">Status</ThemedText>
                <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                  <ThemedText className="text-xs font-medium text-green-800 dark:text-green-200">Saved</ThemedText>
                </View>
              </View>

              <View className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <View className="flex-row items-start">
                  <Icon name="Info" size={16} className="mr-3 mt-1 text-blue-600 dark:text-blue-400" />
                  <View className="flex-1">
                    <ThemedText className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('haircutTitle')}
                    </ThemedText>
                    <ThemedText className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      {cut.photoCount} {cut.photoCount === 1 ? 'photo' : 'photos'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </Section>
        </AnimatedView>
      </ThemedScroller>

      <ThemedFooter>
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
            textClassName="text-white"
            iconStart="UserRoundPen"
            className="flex-1"
            iconColor="white"
            onPress={() => setEditing(true)}
          />
        </View>
      </ThemedFooter>
    </>
  );
}
