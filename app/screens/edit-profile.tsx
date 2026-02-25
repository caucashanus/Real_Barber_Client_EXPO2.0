import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import { Button } from '@/components/Button';
import Icon from '@/components/Icon';
import { router } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { getClientMe, patchClientMe, type ClientMe } from '@/api/client';

export default function EditProfileScreen() {
  const { apiToken } = useAuth();
  const [client, setClient] = useState<ClientMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

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
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setBio(data.bio ?? '');
        setDisplayName(data.displayName ?? '');
        setBirthday(data.birthday ? data.birthday.slice(0, 10) : '');
        setCity(data.city ?? '');
        setZip(data.zip ?? '');
        setCountry(data.country ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarLocalUri(result.assets[0].uri);
  };

  const saveChanges = async () => {
    if (!apiToken) return;
    setSaving(true);
    setError(null);
    try {
      await patchClientMe(apiToken, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        displayName: displayName.trim() || undefined,
        birthday: birthday.trim() || undefined,
        address: { street: street.trim() || undefined, city: city.trim() || undefined, zip: zip.trim() || undefined, country: country.trim() || undefined },
      });
      setClient((prev) => (prev ? { ...prev, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim(), bio: bio.trim(), displayName: displayName.trim(), birthday: birthday.trim() || null, city: city.trim() || null, zip: zip.trim() || null, country: country.trim() || null } : null));
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = avatarLocalUri ? { uri: avatarLocalUri } : client?.avatarUrl ? { uri: client.avatarUrl } : null;

  return (
    <>
      <Header
        showBackButton
        rightComponents={[
          <Button
            title="Save changes"
            textClassName="text-white"
            onPress={saveChanges}
            disabled={loading || saving}
          />,
        ]}
      />
      <ThemedScroller>
        <Section
          titleSize="3xl"
          className="pt-4 pb-10"
          title="Profile Settings"
          subtitle="Manage your account settings"
        />

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" />
            <ThemedText className="mt-3 text-light-subtext dark:text-dark-subtext">Loading profile…</ThemedText>
          </View>
        ) : (
          <>
            {error && (
              <View className="mb-4 rounded-xl bg-red-100 dark:bg-red-900/30 px-4 py-3">
                <ThemedText className="text-red-600 dark:text-red-400">{error}</ThemedText>
              </View>
            )}

            <View className="mb-8">
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">Photo</ThemedText>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8} className="relative">
                  {avatarSrc ? (
                    <Image
                      source={avatarSrc}
                      className="h-20 w-20 rounded-full border-2 border-light-secondary dark:border-dark-secondary"
                    />
                  ) : (
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-light-secondary dark:bg-dark-secondary">
                      <Icon name="CircleUser" size={32} className="text-light-subtext dark:text-dark-subtext" />
                    </View>
                  )}
                </TouchableOpacity>
                <View className="flex-1">
                  <Button title={avatarSrc ? 'Change photo' : 'Upload photo'} variant="outline" onPress={pickImage} />
                  {avatarSrc && (
                    <Button
                      className="mt-2"
                      title="Remove photo"
                      variant="ghost"
                      onPress={() => setAvatarLocalUri(null)}
                    />
                  )}
                </View>
              </View>
            </View>

            <View className="mb-8">
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">Personal information</ThemedText>
              <View className="gap-3">
                <Input
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!saving}
                />
                <Input
                  label="Display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Name visible to others"
                  editable={!saving}
                />
                <Input
                  label="Birthday"
                  value={birthday}
                  onChangeText={setBirthday}
                  placeholder="YYYY-MM-DD"
                  editable={!saving}
                />
              </View>
            </View>

            <View className="mb-8">
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">Contact</ThemedText>
              <View className="gap-3">
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!saving}
                />
                <Input
                  label="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!saving}
                />
              </View>
            </View>

            <View className="mb-8">
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">About</ThemedText>
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                isMultiline
                placeholder="Short description"
                editable={!saving}
              />
            </View>

            <View className="mb-8">
              <ThemedText className="mb-4 text-lg font-bold text-light-primary dark:text-dark-primary">Address</ThemedText>
              <View className="gap-3">
                <Input
                  label="Street"
                  value={street}
                  onChangeText={setStreet}
                  editable={!saving}
                />
                <Input label="City" value={city} onChangeText={setCity} editable={!saving} />
                <Input label="ZIP" value={zip} onChangeText={setZip} keyboardType="numeric" editable={!saving} />
                <Input label="Country" value={country} onChangeText={setCountry} editable={!saving} />
              </View>
            </View>
          </>
        )}
      </ThemedScroller>
    </>
  );
}
