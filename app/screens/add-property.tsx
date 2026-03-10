import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import MultiStep, { Step } from '@/components/MultiStep';
import Selectable from '@/components/forms/Selectable';
import ThemedText from '@/components/ThemedText';
import { Chip } from '@/components/Chip';
import Icon, { IconName } from '@/components/Icon';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';
import Input from '@/components/forms/Input';
import Section from '@/components/layout/Section';
import Counter from '@/components/forms/Counter';
import * as ImagePicker from 'expo-image-picker';
import Grid from '@/components/layout/Grid';
import BarberPicker from '@/components/BarberPicker';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getEmployees, type Employee } from '@/api/employees';

interface PropertyData {
    propertyType: string;
    guestAccessType: string;
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
    photos: string[];
    title: string;
    description: string;
    characteristics: string[];
    stylingDifficulty: number; // 0–100, pro note: Lehká / Střední / Náročná
    barber_id: string; // kdo účes dělal (employee id)
}

const propertyTypeOptions: Array<{ labelKey: string; icon?: IconName; iconImage?: number; value: string }> = [
    { labelKey: 'addPropertyTypeShorter', iconImage: require('@/assets/img/type-shorter.png'), value: 'kratsi' },
    { labelKey: 'addPropertyTypeMediumLength', iconImage: require('@/assets/img/type-medium-length.png'), value: 'stredne_dlouhy' },
    { labelKey: 'addPropertyTypeLonger', iconImage: require('@/assets/img/type-longer.png'), value: 'delsi' },
    { labelKey: 'addPropertyTypeOffice', iconImage: require('@/assets/img/type-office.png'), value: 'do_kanclu' },
    { labelKey: 'addPropertyTypeSporty', iconImage: require('@/assets/img/type-sporty.png'), value: 'sportovni' },
    { labelKey: 'addPropertyTypeModern', iconImage: require('@/assets/img/type-modern.png'), value: 'moderni' },
    { labelKey: 'addPropertyTypeRetro', iconImage: require('@/assets/img/type-retro.png'), value: 'retro' },
    { labelKey: 'addPropertyTypeCasual', iconImage: require('@/assets/img/type-casual.png'), value: 'podpantoflak' },
];

const guestAccessOptions: Array<{ labelKey: string; descKey: string; icon?: IconName; iconImage?: number; value: string }> = [
    { labelKey: 'addPropertySeasonSummer', descKey: 'addPropertySeasonSummerDesc', iconImage: require('@/assets/img/season-summer.png'), value: 'letni' },
    { labelKey: 'addPropertySeasonWinter', descKey: 'addPropertySeasonWinterDesc', iconImage: require('@/assets/img/season-winter.png'), value: 'zimni' },
    { labelKey: 'addPropertySeasonAllYear', descKey: 'addPropertySeasonAllYearDesc', iconImage: require('@/assets/img/season-all-year.png'), value: 'celorocni' },
];

const amenityOptions: Array<{ label: string; labelKey: string; icon: IconName }> = [
    { label: 'Want to try', labelKey: 'addPropertyAmenityWantToTry', icon: 'Sparkles' },
    { label: 'Low maintenance', labelKey: 'addPropertyAmenityLowMaintenance', icon: 'Check' },
    { label: 'Requires styling', labelKey: 'addPropertyAmenityRequiresStyling', icon: 'Zap' },
    { label: "Don't need to dry hair", labelKey: 'addPropertyAmenityNoDryHair', icon: 'Wind' },
    { label: 'Long lasting', labelKey: 'addPropertyAmenityLongLasting', icon: 'Clock' },
    { label: 'Haircut people compliment most', labelKey: 'addPropertyAmenityPeopleCompliment', icon: 'Users' },
    { label: 'My favourite haircut', labelKey: 'addPropertyAmenityMyFavourite', icon: 'Star' },
    { label: 'Looks good with beard', labelKey: 'addPropertyAmenityWithBeard', icon: 'CircleUser' },
    { label: 'Styling', labelKey: 'addPropertyAmenityStyling', icon: 'Sparkles' },
    { label: 'Trying something new', labelKey: 'addPropertyAmenitySomethingNew', icon: 'Lightbulb' },
    { label: 'Recommended by barber', labelKey: 'addPropertyAmenityRecommendedByBarber', icon: 'UserCheck' },
    { label: 'Came back to it', labelKey: 'addPropertyAmenityCameBack', icon: 'RotateCcw' },
];

interface StepProps {
    data: PropertyData;
    updateData: (updates: Partial<PropertyData>) => void;
}

// Step 1: Haircut type (propertyType in data = typ účesu)
const PropertyTypeStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    return (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyWhatDescribes')}</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyChooseOption')}</ThemedText>
        </View>
        {propertyTypeOptions.map((option) => (
            <Selectable
                key={option.value}
                title={t(option.labelKey)}
                icon={option.icon}
                customIcon={option.iconImage != null ? <Image source={option.iconImage} className={option.value === 'delsi' ? 'w-14 h-14' : 'w-12 h-12'} resizeMode="contain" /> : undefined}
                selected={data.propertyType === option.value}
                onPress={() => updateData({ propertyType: option.value })}
            />
        ))}
    </ScrollView>
    );
};

// Step 2: Roční období (guestAccessType in data = období)
const GuestAccessStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    return (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyForWhichSeason')}</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyChooseSeason')}</ThemedText>
        </View>

        {guestAccessOptions.map((option) => (
            <View key={option.value} className="mb-1">
                <Selectable
                    title={t(option.labelKey)}
                    description={t(option.descKey)}
                    icon={option.icon}
                    customIcon={option.iconImage != null ? <Image source={option.iconImage} className="w-12 h-12" resizeMode="contain" /> : undefined}
                    selected={data.guestAccessType === option.value}
                    onPress={() => updateData({ guestAccessType: option.value })}
                />
            </View>
        ))}
    </ScrollView>
    );
};

// Step 3: Základní údaje o účesu (guests = cm u uší, bedrooms = cm nahoře, beds = týdnů mezi přestříháním)
const PropertyBasicsStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    return (
        <ScrollView className="p-4 px-8">
            <View className='mb-10'>
                <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyBasicDetails')}</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyFillLengths')}</ThemedText>
            </View>

            <View className="mt-4">
                <View className="flex-row items-center justify-between py-4">
                    <View className="flex-1 pr-4">
                        <ThemedText className="text-lg">{t('addPropertyLengthAtEars')}</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('addPropertyLengthCm')}</ThemedText>
                    </View>
                    <Counter
                        value={data.guests}
                        onChange={(value) => updateData({ guests: value ?? 0 })}
                        min={0}
                        max={20}
                    />
                </View>

                <View className="flex-row items-center justify-between py-4 border-t border-light-secondary dark:border-dark-secondary">
                    <View className="flex-1 pr-4">
                        <ThemedText className="text-lg">{t('addPropertyLengthOnTop')}</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('addPropertyLengthCm')}</ThemedText>
                    </View>
                    <Counter
                        value={data.bedrooms}
                        onChange={(value) => updateData({ bedrooms: value ?? 0 })}
                        min={0}
                        max={20}
                    />
                </View>

                <View className="flex-row items-center justify-between py-4 border-t border-light-secondary dark:border-dark-secondary">
                    <View className="flex-1 pr-4">
                        <ThemedText className="text-lg">{t('addPropertyHowOftenTrim')}</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">{t('addPropertyWeeksToComeIn')}</ThemedText>
                    </View>
                    <Counter
                        value={data.beds}
                        onChange={(value) => updateData({ beds: value ?? 4 })}
                        min={1}
                        max={24}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

// Step 4: Co k účesu patří (amenities = vybrané chipy → do note)
const AmenitiesStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    return (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyWhatGoesWith')}</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertySelectMultiple')}</ThemedText>
        </View>

        <View className="flex-row flex-wrap gap-3 mt-4">
            {amenityOptions.map((amenity) => (
                <Chip
                    size='lg'
                    key={amenity.label}
                    label={t(amenity.labelKey)}
                    icon={amenity.icon}
                    isSelected={data.amenities.includes(amenity.label)}
                    onPress={() => {
                        const newAmenities = data.amenities.includes(amenity.label)
                            ? data.amenities.filter(a => a !== amenity.label)
                            : [...data.amenities, amenity.label];
                        updateData({ amenities: newAmenities });
                    }}
                />
            ))}
        </View>
    </ScrollView>
    );
};

// Step 5: Photos
const PhotosStep: React.FC<StepProps> = ({ data, updateData }) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            updateData({ photos: [...data.photos, result.assets[0].uri] });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });
        if (!result.canceled && result.assets[0]) {
            updateData({ photos: [...data.photos, result.assets[0].uri] });
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = data.photos.filter((_, i) => i !== index);
        updateData({ photos: newPhotos });
    };

    const { t } = useTranslation();
    return (
        <ScrollView className="p-4 px-8">
            <View className='mb-10'>
                <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyAddPhotos')}</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyAtLeastOnePhoto')}</ThemedText>
            </View>

            <Grid columns={2} spacing={10}>
                {data.photos.map((photo, index) => (
                    <View key={index} className="relative w-full h-44    ">
                        <Image
                            source={{ uri: photo }}
                            className="w-full h-44 rounded-lg"
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                        >
                            <Icon name="X" size={12} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full h-44 rounded-lg border-2 border-dashed border-light-subtext dark:border-dark-subtext items-center justify-center"
                >
                    <Icon name="Plus" size={24} className="text-light-subtext dark:text-dark-subtext" />
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">{t('addPropertyAddPhoto')}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={takePhoto}
                    className="w-full h-44 rounded-lg border-2 border-dashed border-light-subtext dark:border-dark-subtext items-center justify-center"
                >
                    <Icon name="Plus" size={24} className="text-light-subtext dark:text-dark-subtext" />
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">{t('addPropertyTakePhoto')}</ThemedText>
                </TouchableOpacity>
            </Grid>
        </ScrollView>
    );
};

// Step 6: Title and Description (název účesu + popis)
const TitleDescriptionStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    return (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyNowName')}</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyShortName')}</ThemedText>
        </View>

        <Section title={t('addPropertyTitle')} titleSize="md" padding="sm">
            <Input
                variant='classic'
                containerClassName="mt-1 mb-0"
                placeholder="e.g. Low Fade, Summer look"
                value={data.title}
                onChangeText={(text) => updateData({ title: text })}
                maxLength={50}
            />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {data.title.length}/50
            </ThemedText>
        </Section>

        <Section title={t('addPropertyDescription')} titleSize="md" padding="sm" className="mt-6">
            <Input
                variant='classic'
                containerClassName="mt-1 mb-0"
                placeholder="Optional note about the haircut"
                value={data.description}
                onChangeText={(text) => updateData({ description: text })}
                isMultiline={true}
                maxLength={500}
            />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">
                {data.description.length}/500
            </ThemedText>
        </Section>
    </ScrollView>
    );
};

function stylingDifficultyLabel(value: number): string {
    if (value <= 16) return 'Very easy';
    if (value <= 33) return 'Easy';
    if (value <= 50) return 'Medium';
    if (value <= 66) return 'Trickier';
    if (value <= 83) return 'Demanding';
    return 'Very demanding';
}

// Step 7: Náročnost stylingu + kdo účes dělal
const CharacteristicsStep: React.FC<StepProps> = ({ data, updateData }) => {
    const { t } = useTranslation();
    const { apiToken } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (!apiToken) return;
        getEmployees(apiToken)
            .then(setEmployees)
            .catch(() => setEmployees([]));
    }, [apiToken]);

    return (
        <ScrollView className="p-4 px-8">
            <View className='mb-10'>
                <ThemedText className='text-3xl font-semibold mt-auto'>{t('addPropertyStylingDifficulty')}</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>{t('addPropertyHowDemanding')}</ThemedText>
            </View>

            <Section title={t('addPropertyDifficulty')} titleSize="md" padding="sm" className="mt-2">
                <Slider
                    style={{ width: '100%', height: 40 }}
                    value={data.stylingDifficulty}
                    minimumValue={0}
                    maximumValue={100}
                    onValueChange={(v) => updateData({ stylingDifficulty: v })}
                    minimumTrackTintColor="#FF2358"
                    maximumTrackTintColor="rgba(0,0,0,0.2)"
                    step={1}
                />
                <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mt-1">
                    {stylingDifficultyLabel(data.stylingDifficulty)}
                </ThemedText>
            </Section>

            <Section title={t('addPropertySelectBarber')} titleSize="md" padding="sm" className="mt-6">
                <View className="-mx-8 mt-6" style={{ marginHorizontal: -32 }}>
                    <BarberPicker
                        employees={employees}
                        value={data.barber_id}
                        onChange={(id) => updateData({ barber_id: id })}
                        label=""
                    />
                </View>
            </Section>
        </ScrollView>
    );
};

// Success Step
const SuccessStep: React.FC<StepProps> = ({ data }) => {
    const { t } = useTranslation();
    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, []);
    return (
        <View className="p-8 flex-1 items-center justify-center">
            <Image
                source={require('@/assets/img/gratulations.png')}
                className="w-32 h-32 rounded-lg"
                resizeMode="cover"
            />
            <ThemedText className="text-3xl font-bold mt-8 text-center">{t('addPropertyCongratulations')}</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center mb-8 mt-1">
                {t('addPropertySuccessMessage')}
            </ThemedText>

            {/*<View className="w-full bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 mb-8">
                <View className="flex-row items-center">
                    <Image
                        source={require('@/assets/img/room-1.avif')}
                        className="w-20 h-20 rounded-lg mr-4"
                        resizeMode="cover"
                    />

                    <View className="flex-1">
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext mb-0">
                            {propertyTypeOptions.find(p => p.value === data.propertyType)?.label || 'Property'}
                        </ThemedText>
                        <ThemedText className="text-base font-semibold mb-0" numberOfLines={2}>
                            {data.title || 'Your Amazing Place'}
                        </ThemedText>

                    </View>
                </View>
            </View>*/}
        </View>
    );
};

export default function AddPropertyScreen() {
    const { t } = useTranslation();
    const [data, setData] = useState<PropertyData>({
        propertyType: '',
        guestAccessType: '',
        guests: 0,
        bedrooms: 0,
        beds: 4,
        bathrooms: 1,
        amenities: [],
        photos: [],
        title: '',
        description: '',
        characteristics: [],
        stylingDifficulty: 50,
    });

    const updateData = (updates: Partial<PropertyData>) => {
        setData(current => ({ ...current, ...updates }));
    };

    return (
        <MultiStep
            onComplete={() => {
                router.push('/screens/product-detail');
            }}
            onClose={() => router.push('/(drawer)/(tabs)/')}
            showStepIndicator={false}
        >
            <Step title={t('addPropertyStepHaircutType')}>
                <PropertyTypeStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepSeason')}>
                <GuestAccessStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepBasics')}>
                <PropertyBasicsStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepFeatures')}>
                <AmenitiesStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepPhotos')}>
                <PhotosStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepTitleDesc')}>
                <TitleDescriptionStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepStyling')}>
                <CharacteristicsStep data={data} updateData={updateData} />
            </Step>

            <Step title={t('addPropertyStepSuccess')}>
                <SuccessStep data={data} updateData={updateData} />
            </Step>
        </MultiStep>
    );
} 