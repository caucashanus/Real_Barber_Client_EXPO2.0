import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
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

const propertyTypeOptions: Array<{ label: string; icon: IconName; value: string }> = [
    { label: 'Kratší', icon: 'CircleDot', value: 'kratsi' },
    { label: 'Středně dlouhý', icon: 'Ruler', value: 'stredne_dlouhy' },
    { label: 'Delší', icon: 'Maximize', value: 'delsi' },
    { label: 'Do kanclu', icon: 'Briefcase', value: 'do_kanclu' },
    { label: 'Sportovní', icon: 'Dumbbell', value: 'sportovni' },
    { label: 'Moderní', icon: 'Sparkles', value: 'moderni' },
    { label: 'Retro', icon: 'Clock', value: 'retro' },
    { label: 'Podpantoflák', icon: 'Home', value: 'podpantoflak' },
];

const guestAccessOptions: Array<{ label: string; description: string; icon: IconName; value: string }> = [
    { label: 'Letní', description: 'Účes pro teplé měsíce.', icon: 'Sun', value: 'letni' },
    { label: 'Zimní', description: 'Účes do chladného počasí.', icon: 'Snowflake', value: 'zimni' },
    { label: 'Celoroční', description: 'Nosíš ho pořád.', icon: 'Calendar', value: 'celorocni' },
];

const amenityOptions: Array<{ label: string; icon: IconName }> = [
    { label: 'Chci zkusit', icon: 'Sparkles' },
    { label: 'Bez údržby', icon: 'Check' },
    { label: 'Vyžaduje styling', icon: 'Zap' },
    { label: 'Nemusím si sušit vlasy', icon: 'Wind' },
    { label: 'Dlouho vydrží', icon: 'Clock' },
    { label: 'Účes co mi nejvíc chválí okolí', icon: 'Users' },
    { label: 'Můj nejoblíbenější účes', icon: 'Star' },
    { label: 'Sluší mi s vousy', icon: 'CircleUser' },
    { label: 'Styling', icon: 'Sparkles' },
    { label: 'Zkouším něco nového', icon: 'Lightbulb' },
    { label: 'Doporučeno barberem', icon: 'UserCheck' },
    { label: 'Vrátil jsem se k němu', icon: 'RotateCcw' },
];

interface StepProps {
    data: PropertyData;
    updateData: (updates: Partial<PropertyData>) => void;
}

// Step 1: Haircut type (propertyType in data = typ účesu)
const PropertyTypeStep: React.FC<StepProps> = ({ data, updateData }) => (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>Co nejvíc vystihuje tvůj účes?</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Vyber možnost, která ti sedí nejvíc</ThemedText>
        </View>
        {propertyTypeOptions.map((option) => (
            <Selectable
                key={option.value}
                title={option.label}
                icon={option.icon}
                selected={data.propertyType === option.value}
                onPress={() => updateData({ propertyType: option.value })}
            />
        ))}
    </ScrollView>
);

// Step 2: Roční období (guestAccessType in data = období)
const GuestAccessStep: React.FC<StepProps> = ({ data, updateData }) => (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>Pro jaké roční období?</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Vyber, kdy účes nejvíc nosíš</ThemedText>
        </View>

        {guestAccessOptions.map((option) => (
            <View key={option.value} className="mb-1">
                <Selectable
                    title={option.label}
                    description={option.description}
                    icon={option.icon}
                    selected={data.guestAccessType === option.value}
                    onPress={() => updateData({ guestAccessType: option.value })}
                />
            </View>
        ))}
    </ScrollView>
);

// Step 3: Základní údaje o účesu (guests = cm u uší, bedrooms = cm nahoře, beds = týdnů mezi přestříháním)
const PropertyBasicsStep: React.FC<StepProps> = ({ data, updateData }) => {
    return (
        <ScrollView className="p-4 px-8">
            <View className='mb-10'>
                <ThemedText className='text-3xl font-semibold mt-auto'>Základní údaje o účesu</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Doplň délky a jak často účes obnovovat</ThemedText>
            </View>

            <View className="mt-4">
                <View className="flex-row items-center justify-between py-4">
                    <View className="flex-1 pr-4">
                        <ThemedText className="text-lg">Délka u uší</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">Jaká délka v cm</ThemedText>
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
                        <ThemedText className="text-lg">Délka nahoře</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">Jaká délka v cm</ThemedText>
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
                        <ThemedText className="text-lg">Jak často přestříhat?</ThemedText>
                        <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">Každých kolik týdnů je třeba přijít</ThemedText>
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
const AmenitiesStep: React.FC<StepProps> = ({ data, updateData }) => (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>Co k účesu patří?</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Vyber všechno, co k tvému účesu sedí. Můžeš vybrat víc možností.</ThemedText>
        </View>

        <View className="flex-row flex-wrap gap-3 mt-4">
            {amenityOptions.map((amenity) => (
                <Chip
                    size='lg'
                    key={amenity.label}
                    label={amenity.label}
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

    return (
        <ScrollView className="p-4 px-8">
            <View className='mb-10'>
                <ThemedText className='text-3xl font-semibold mt-auto'>Přidej fotky účesu</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Alespoň jedna fotka pomůže. Můžeš jich přidat víc nebo později upravit.</ThemedText>
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
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Přidat fotku</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={takePhoto}
                    className="w-full h-44 rounded-lg border-2 border-dashed border-light-subtext dark:border-dark-subtext items-center justify-center"
                >
                    <Icon name="Plus" size={24} className="text-light-subtext dark:text-dark-subtext" />
                    <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext mt-1">Vyfotit fotku</ThemedText>
                </TouchableOpacity>
            </Grid>
        </ScrollView>
    );
};

// Step 6: Title and Description (název účesu + popis)
const TitleDescriptionStep: React.FC<StepProps> = ({ data, updateData }) => (
    <ScrollView className="p-4 px-8">
        <View className='mb-10'>
            <ThemedText className='text-3xl font-semibold mt-auto'>Teď pojmenuj svůj účes</ThemedText>
            <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Krátký název stačí. Můžeš ho kdykoliv změnit.</ThemedText>
        </View>

        <Section title="Název" titleSize="md" padding="sm">
            <Input
                variant='classic'
                containerClassName="mt-1 mb-0"
                placeholder="např. Low Fade, Letní úprava"
                value={data.title}
                onChangeText={(text) => updateData({ title: text })}
                maxLength={50}
            />
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {data.title.length}/50
            </ThemedText>
        </Section>

        <Section title="Popis" titleSize="md" padding="sm" className="mt-6">
            <Input
                variant='classic'
                containerClassName="mt-1 mb-0"
                placeholder="Volitelná poznámka k účesu"
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

function stylingDifficultyLabel(value: number): string {
    if (value <= 33) return 'Lehká';
    if (value <= 66) return 'Střední';
    return 'Náročná';
}

// Step 7: Náročnost stylingu + kdo účes dělal
const CharacteristicsStep: React.FC<StepProps> = ({ data, updateData }) => {
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
                <ThemedText className='text-3xl font-semibold mt-auto'>Náročnost stylingu</ThemedText>
                <ThemedText className='text-base text-light-subtext dark:text-dark-subtext'>Jak náročné je účes na každodenní úpravu?</ThemedText>
            </View>

            <Section title="Obtížnost" titleSize="md" padding="sm" className="mt-2">
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

            <Section title="Vyberte, kdo vám účes dělal" titleSize="md" padding="sm" className="mt-6">
                <BarberPicker
                    employees={employees}
                    value={data.barber_id}
                    onChange={(id) => updateData({ barber_id: id })}
                    label=""
                />
            </Section>
        </ScrollView>
    );
};

// Success Step
const SuccessStep: React.FC<StepProps> = ({ data }) => {
    return (
        <View className="p-8 flex-1 items-center justify-center">
            <Image
                source={require('@/assets/img/bed.png')}
                className="w-32 h-32 rounded-lg"
                resizeMode="cover"
            />
            <ThemedText className="text-3xl font-bold mt-8 text-center">Gratulujeme!</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext text-center mb-8 mt-1">
                Váš účes byl úspěšně uložen. Najdete ho v sekci Moje účesy.
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
            <Step title="Property Type">
                <PropertyTypeStep data={data} updateData={updateData} />
            </Step>

            <Step title="Guest Access">
                <GuestAccessStep data={data} updateData={updateData} />
            </Step>

            <Step title="Basics">
                <PropertyBasicsStep data={data} updateData={updateData} />
            </Step>

            <Step title="Amenities">
                <AmenitiesStep data={data} updateData={updateData} />
            </Step>

            <Step title="Photos">
                <PhotosStep data={data} updateData={updateData} />
            </Step>

            <Step title="Title & Description">
                <TitleDescriptionStep data={data} updateData={updateData} />
            </Step>

            <Step title="Characteristics">
                <CharacteristicsStep data={data} updateData={updateData} />
            </Step>

            <Step title="Success">
                <SuccessStep data={data} updateData={updateData} />
            </Step>
        </MultiStep>
    );
} 