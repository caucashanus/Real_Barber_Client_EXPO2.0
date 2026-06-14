import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { uploadClientMedia } from '@/api/client';
import { createClientCut } from '@/api/cuts';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import MultiStep, { Step } from '@/components/MultiStep';
import AmenitiesStep from '@/components/haircut-create/AmenitiesStep';
import CharacteristicsStep from '@/components/haircut-create/CharacteristicsStep';
import GuestAccessStep from '@/components/haircut-create/GuestAccessStep';
import PhotosStep from '@/components/haircut-create/PhotosStep';
import PropertyBasicsStep from '@/components/haircut-create/PropertyBasicsStep';
import PropertyTypeStep from '@/components/haircut-create/PropertyTypeStep';
import SuccessStep from '@/components/haircut-create/SuccessStep';
import TitleDescriptionStep from '@/components/haircut-create/TitleDescriptionStep';
import { MY_HAIRCUTS_ROUTE } from '@/components/haircut-create/constants';
import type { PropertyData } from '@/components/haircut-create/types';
import { buildHaircutNote } from '@/utils/haircut-note-build';

export default function HaircutCreateScreen() {
  const { t } = useTranslation();
  const { apiToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<PropertyData>({
    propertyTypes: [],
    guestAccessTypes: [],
    guests: 0,
    bedrooms: 0,
    beds: 4,
    bathrooms: 1,
    amenities: [],
    photoAssets: [],
    title: '',
    description: '',
    characteristics: [],
    stylingDifficulty: 50,
    barber_id: '',
  });

  const updateData = (updates: Partial<PropertyData>) => {
    setData((current) => ({ ...current, ...updates }));
  };

  const isNextDisabled = useCallback(
    (stepIndex: number) => {
      if (stepIndex === 0) return data.propertyTypes.length === 0;
      if (stepIndex === 1) return data.guestAccessTypes.length === 0;
      if (stepIndex === 5) return !data.title.trim();
      return false;
    },
    [data.propertyTypes, data.guestAccessTypes, data.title]
  );

  const handleWizardComplete = useCallback(() => {
    if (!apiToken) {
      Alert.alert('', t('haircutCreateLoginRequired'));
      return;
    }
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle) {
      Alert.alert('', t('haircutCreateCutSaveFailed'));
      return;
    }

    setSubmitting(true);
    (async () => {
      try {
        const photoIds: string[] = [];
        for (const asset of data.photoAssets) {
          const uploaded = await uploadClientMedia(apiToken, {
            uri: asset.uri,
            name: asset.fileName ?? undefined,
            mimeType: asset.mimeType ?? undefined,
            title: trimmedTitle,
            alt: trimmedTitle,
          });
          photoIds.push(uploaded.id);
        }

        const noteText = buildHaircutNote(data, t);
        await createClientCut(apiToken, {
          hairstyle: trimmedTitle,
          note: noteText || null,
          barber_id: data.barber_id.trim() || null,
          photos: photoIds,
        });

        router.replace(MY_HAIRCUTS_ROUTE);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('haircutCreateCutSaveFailed');
        Alert.alert('', msg);
      } finally {
        setSubmitting(false);
      }
    })().catch(() => {});
  }, [apiToken, data, t]);

  return (
    <MultiStep
      onComplete={handleWizardComplete}
      onClose={() => router.replace(MY_HAIRCUTS_ROUTE)}
      showStepIndicator={false}
      footerLoading={submitting}
      isNextDisabled={isNextDisabled}>
      <Step title={t('haircutCreateStepHaircutType')}>
        <PropertyTypeStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepSeason')}>
        <GuestAccessStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepBasics')}>
        <PropertyBasicsStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepFeatures')}>
        <AmenitiesStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepPhotos')}>
        <PhotosStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepTitleDesc')}>
        <TitleDescriptionStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepStyling')}>
        <CharacteristicsStep data={data} updateData={updateData} />
      </Step>

      <Step title={t('haircutCreateStepSuccess')} hideHeaderBack hideHeaderClose>
        <SuccessStep data={data} updateData={updateData} />
      </Step>
    </MultiStep>
  );
}
