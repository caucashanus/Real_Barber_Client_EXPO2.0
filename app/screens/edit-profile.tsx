import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, Pressable, Linking, ScrollView } from 'react-native';
import { ActionSheetRef } from 'react-native-actions-sheet';

import { getClientMe, patchClientMe, uploadClientMedia, type ClientMe } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import useThemeColors from '@/contexts/ThemeColors';
import { useTranslation } from '@/hooks/useTranslation';
import ActionSheetThemed from '@/components/ActionSheetThemed';
import { Button } from '@/components/Button';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { DatePicker } from '@/components/forms/DatePicker';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Section from '@/components/layout/Section';
import { pickSquareAvatarFromLibrary, takeSquareAvatarPhoto } from '@/utils/avatar-picker';
import { formatBirthdayToIsoUtcMidnight, formatToYYYYMMDD } from '@/utils/date';
import {
  buildEditProfileAvatarPatch,
  hasServerProfileAvatar} from '@/utils/editProfileAvatar';
import { COUNTRY_OPTIONS } from '@/utils/phone';
import SiteLoadingSpinner from '@/components/SiteLoadingSpinner';

type EditProfileFocus = 'email' | 'birthday' | 'avatar' | 'address';

export default function EditProfileScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { apiToken, token, client: authClient, setAuth } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Partial<Record<EditProfileFocus, number>>>({});
  const [client, setClient] = useState<ClientMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] = useState<ImagePickerAsset | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const phoneInfoSheetRef = useRef<ActionSheetRef>(null);
  const photoSourceSheetRef = useRef<ActionSheetRef>(null);

  const registerSectionOffset = useCallback((key: EditProfileFocus, y: number) => {
    sectionOffsetsRef.current[key] = y;
  }, []);

  useEffect(() => {
    if (loading) return;
    const focusKey = focus as EditProfileFocus | undefined;
    if (!focusKey || !sectionOffsetsRef.current[focusKey]) return;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, (sectionOffsetsRef.current[focusKey] ?? 0) - 16),
        animated: true});
    }, 250);

    return () => clearTimeout(timer);
  }, [focus, loading]);

  const phoneChangeRequestMessage = useMemo(() => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim() || '—';
    const current = phone.trim() || '—';
    return t('editProfilePhoneChangeRequestBody')
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{current\}\}/g, current);
  }, [firstName, lastName, phone, t]);

  const openSmsRequest = () =>
    Linking.openURL(`sms:+420608332881?body=${encodeURIComponent(phoneChangeRequestMessage)}`);
  const openWhatsAppRequest = () =>
    Linking.openURL(
      `https://wa.me/420608332881?text=${encodeURIComponent(phoneChangeRequestMessage)}`
    );

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getClientMe(apiToken)
      .then((data) => {
        setClient(data);
        setAvatarLocalUri(null);
        setAvatarAsset(null);
        setAvatarRemoved(false);
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setBirthday(data.birthday ? data.birthday.slice(0, 10) : '');
        setStreet(data.address ?? '');
        setCity(data.city ?? '');
        setZip(data.zip ?? '');
        setCountry(data.country ? String(data.country).trim().toUpperCase().slice(0, 3) : '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const setPickedAvatar = (asset: ImagePickerAsset) => {
    setAvatarLocalUri(asset.uri);
    setAvatarAsset(asset);
    setAvatarRemoved(false);
  };

  const pickFromLibrary = async () => {
    const asset = await pickSquareAvatarFromLibrary();
    if (asset) setPickedAvatar(asset);
  };

  const takePhoto = async () => {
    const asset = await takeSquareAvatarPhoto();
    if (asset) setPickedAvatar(asset);
  };

  const openPhotoSourceSheet = () => photoSourceSheetRef.current?.show();

  const onChooseLibrary = () => {
    photoSourceSheetRef.current?.hide();
    setTimeout(() => {
      pickFromLibrary().catch(() => {});
    }, 500);
  };

  const onChooseCamera = () => {
    photoSourceSheetRef.current?.hide();
    setTimeout(() => {
      takePhoto().catch(() => {});
    }, 500);
  };

  const saveChanges = async () => {
    if (!apiToken) return;
    setSaving(true);
    setError(null);
    try {
      let uploadedAvatarUrl: string | undefined;
      if (avatarAsset?.uri) {
        const uploaded = await uploadClientMedia(apiToken, {
          uri: avatarAsset.uri,
          name: avatarAsset.fileName ?? undefined,
          mimeType: avatarAsset.mimeType ?? undefined,
          title: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
          alt: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined});
        uploadedAvatarUrl = uploaded.url;
      }

      const updated = await patchClientMe(apiToken, {
        ...buildEditProfileAvatarPatch({
          uploadedAvatarUrl,
          avatarRemoved}),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        birthday: birthday.trim()
          ? formatBirthdayToIsoUtcMidnight(new Date(`${birthday.trim()}T12:00:00`))
          : undefined,
        address: street.trim() || undefined,
        city: city.trim() || undefined,
        zip: zip.trim() || undefined,
        country: country.trim() || undefined});

      if (token && authClient) {
        const displayName =
          [updated.firstName, updated.lastName].filter(Boolean).join(' ').trim() ||
          updated.name ||
          authClient.name;
        await setAuth(token, apiToken, {
          ...authClient,
          name: displayName,
          email: updated.email ?? authClient.email,
          phone: updated.phone ?? authClient.phone,
          avatarUrl: updated.avatarUrl,
          address: updated.address ?? authClient.address,
          birthday: updated.birthday ?? authClient.birthday});
      }

      setClient(updated);
      setAvatarLocalUri(null);
      setAvatarAsset(null);
      setAvatarRemoved(false);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = avatarLocalUri
    ? { uri: avatarLocalUri }
    : avatarRemoved
      ? null
      : client?.avatarUrl
        ? { uri: client.avatarUrl }
        : null;

  const canRemoveAvatar = Boolean(
    avatarLocalUri || (hasServerProfileAvatar(client?.avatarUrl) && !avatarRemoved)
  );

  return (
    <>
      <Header
        showBackButton
        rightComponents={[
          <Button
            title={t('editProfileSaveChanges')}
            textClassName="text-white"
            onPress={saveChanges}
            disabled={loading || saving}
          />,
        ]}
      />
      <ThemedScroller ref={scrollRef}>
        <Section
          titleSize="3xl"
          className="pb-10 pt-4"
          title={t('editProfileTitle')}
          subtitle={t('editProfileSubtitle')}
        />

        {loading ? (
          <View className="items-center py-12">
            <SiteLoadingSpinner />
            <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">
              {t('editProfileLoading')}
            </ThemedText>
          </View>
        ) : (
          <>
            {error && (
              <View className="mb-4 rounded-xl bg-red-100 px-4 py-3 dark:bg-red-900/30">
                <ThemedText className="text-red-600 dark:text-red-400">{error}</ThemedText>
              </View>
            )}

            <View
              className="mb-8"
              onLayout={(event) => registerSectionOffset('avatar', event.nativeEvent.layout.y)}>
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">
                {t('editProfilePhoto')}
              </ThemedText>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={openPhotoSourceSheet}
                  activeOpacity={0.8}
                  className="relative">
                  {avatarSrc ? (
                    <Image
                      source={avatarSrc}
                      className="h-20 w-20 rounded-full border-2 border-light-secondary dark:border-dark-secondary"
                    />
                  ) : (
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                      <Icon
                        name="CircleUser"
                        size={32}
                        className="text-light-subtext dark:text-dark-subtext"
                      />
                    </View>
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <Button
                    title={avatarSrc ? t('editProfileChangePhoto') : t('editProfileUploadPhoto')}
                    variant="outline"
                    onPress={openPhotoSourceSheet}
                  />
                  {canRemoveAvatar && (
                    <Button
                      className="mt-2"
                      title={t('editProfileRemovePhoto')}
                      variant="ghost"
                      onPress={() => {
                        setAvatarLocalUri(null);
                        setAvatarAsset(null);
                        setAvatarRemoved(true);
                      }}
                    />
                  )}
                </View>
              </View>
            </View>

            <ActionSheetThemed ref={photoSourceSheetRef} gestureEnabled>
              <View className="p-5 pb-7">
                <View className="mt-4 gap-2">
                  <Button title={t('editProfilePhotoSourceCamera')} onPress={onChooseCamera} />
                  <Button
                    title={t('editProfilePhotoSourceLibrary')}
                    variant="outline"
                    onPress={onChooseLibrary}
                  />
                </View>
              </View>
            </ActionSheetThemed>

            <View
              className="mb-8"
              onLayout={(event) => registerSectionOffset('birthday', event.nativeEvent.layout.y)}>
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">
                {t('editProfilePersonalInfo')}
              </ThemedText>
              <View className="gap-3">
                <Input
                  label={t('editProfileFirstName')}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <Input
                  label={t('editProfileLastName')}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <DatePicker
                  label={t('editProfileBirthday')}
                  value={birthday ? new Date(birthday + 'T12:00:00') : undefined}
                  onChange={(date) => setBirthday(formatToYYYYMMDD(date))}
                  variant="classic"
                  minDate={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 100);
                    return d;
                  })()}
                  maxDate={(() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() - 5);
                    return d;
                  })()}
                />
              </View>
            </View>

            <View
              className="mb-8"
              onLayout={(event) => registerSectionOffset('email', event.nativeEvent.layout.y)}>
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">
                {t('editProfileContact')}
              </ThemedText>
              <View className="gap-3">
                <Input
                  label={t('editProfileEmail')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!saving}
                />
                <View>
                  <View className="mb-2 flex-row items-center justify-between">
                    <ThemedText className="text-base font-medium text-light-primary dark:text-dark-primary">
                      {t('editProfilePhone')}
                    </ThemedText>
                    <Pressable
                      onPress={() => phoneInfoSheetRef.current?.show()}
                      hitSlop={8}
                      className="p-1">
                      <Icon
                        name="Info"
                        size={18}
                        className="text-light-subtext dark:text-dark-subtext"
                      />
                    </Pressable>
                  </View>
                  <Input
                    label=""
                    value={phone}
                    onChangeText={() => {}}
                    keyboardType="phone-pad"
                    editable={false}
                  />
                </View>
              </View>
            </View>

            <View
              className="mb-8"
              onLayout={(event) => registerSectionOffset('address', event.nativeEvent.layout.y)}>
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">
                {t('editProfileAddress')}
              </ThemedText>
              <View className="gap-3">
                <Input
                  label={t('editProfileStreet')}
                  value={street}
                  onChangeText={setStreet}
                  editable={!saving}
                />
                <Input
                  label={t('editProfileCity')}
                  value={city}
                  onChangeText={setCity}
                  editable={!saving}
                />
                <Input
                  label={t('editProfileZip')}
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                  editable={!saving}
                />
                <Select
                  label={t('editProfileCountry')}
                  options={COUNTRY_OPTIONS}
                  value={country}
                  onChange={(v) => setCountry(String(v))}
                  placeholder="CZE"
                  variant="classic"
                  className="mb-0"
                />
              </View>
            </View>
          </>
        )}
      </ThemedScroller>

      <ActionSheetThemed ref={phoneInfoSheetRef} gestureEnabled>
        <View className="p-4 pb-6">
          <ThemedText className="mb-3 text-lg font-semibold text-light-text dark:text-dark-text">
            {t('editProfilePhoneNumber')}
          </ThemedText>
          <ThemedText className="mb-6 text-base leading-6 text-light-subtext dark:text-dark-subtext">
            {t('editProfilePhoneInfoBeforeCall')}{' '}
            <ThemedText
              style={{ color: colors.highlight }}
              className="text-base font-semibold underline"
              onPress={() => Linking.openURL('sms:+420608332881')}>
              +420 608 332 881
            </ThemedText>{' '}
            {t('editProfilePhoneInfoAfterCall')}
          </ThemedText>

          <View className="w-full flex-row justify-center">
            <Button title={t('editProfileSendSms')} className="flex-1" onPress={openSmsRequest} />
            <Button
              title={t('editProfileWhatsApp')}
              variant="outline"
              className="ml-3 px-6"
              onPress={openWhatsAppRequest}
            />
          </View>
        </View>
      </ActionSheetThemed>
    </>
  );
}
