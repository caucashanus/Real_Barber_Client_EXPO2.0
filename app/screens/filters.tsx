import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import Counter from '@/components/forms/Counter';
import { Button } from '@/components/Button';
import ThemedScroller from '@/components/ThemeScroller';
import ThemeFooter from '@/components/ThemeFooter';
import Header from '@/components/Header';
import Section from '@/components/layout/Section';
import { Chip } from '@/components/Chip';
import Switch from '@/components/forms/Switch';
import { useBranchFilter, type BranchFilterState } from '@/app/contexts/BranchFilterContext';
import ThemedText from '@/components/ThemedText';

export default function FiltersScreen() {
    const router = useRouter();
    const { filter: savedFilter, setFilter } = useBranchFilter();

    const [minSizeM2, setMinSizeM2] = useState(savedFilter.minSizeM2);
    const [minChairs, setMinChairs] = useState<number | undefined>(savedFilter.minChairs);
    const [minWashBasins, setMinWashBasins] = useState<number | undefined>(savedFilter.minWashBasins);
    const [amenities, setAmenities] = useState(savedFilter.amenities);
    const [options, setOptions] = useState(savedFilter.options);

    useEffect(() => {
        setMinSizeM2(savedFilter.minSizeM2);
        setMinChairs(savedFilter.minChairs);
        setMinWashBasins(savedFilter.minWashBasins);
        setAmenities(savedFilter.amenities);
        setOptions(savedFilter.options);
    }, [savedFilter.minSizeM2, savedFilter.minChairs, savedFilter.minWashBasins, savedFilter.amenities, savedFilter.options]);

    const toggleAmenity = (key: keyof BranchFilterState['amenities']) => {
        setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleOption = (key: keyof BranchFilterState['options']) => {
        setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleApplyFilters = () => {
        const next: BranchFilterState = {
            minSizeM2,
            minChairs,
            minWashBasins,
            amenities,
            options,
        };
        setFilter(next);
        router.back();
    };

    return (
        <>
            <Header showBackButton title="Filters" />
            <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary">
                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Branch size (m²)" subtitle={`At least ${Math.round(minSizeM2)} m²`}>
                   <Slider
                       style={{ width: "100%", height: 40 }}
                       value={minSizeM2}
                       minimumValue={20}
                       maximumValue={85}
                       onValueChange={setMinSizeM2}
                       minimumTrackTintColor="#FF2358"
                       maximumTrackTintColor="rgba(0,0,0,0.2)"
                       step={5}
                   />
               </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Amenities and layout">
                    <CounterRow label="Number of chairs" value={minChairs} onChange={setMinChairs} />
                    <CounterRow label="Number of wash basins" value={minWashBasins} onChange={setMinWashBasins} />
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Amenities">
                    <View className='flex-row flex-wrap gap-2 mt-2'>
                        <Chip icon="Wallet" label="Card payment" size="lg" selectable isSelected={amenities.cardPayment} onPress={() => toggleAmenity('cardPayment')} />
                        <Chip icon="Coffee" label="Coffee machine" size="lg" selectable isSelected={amenities.coffeeMachine} onPress={() => toggleAmenity('coffeeMachine')} />
                        <Chip icon="CreditCard" label="Self-service checkout" size="lg" selectable isSelected={amenities.selfServiceCheckout} onPress={() => toggleAmenity('selfServiceCheckout')} />
                        <Chip icon="Train" label="Within 100m of metro" size="lg" selectable isSelected={amenities.within100mMetro} onPress={() => toggleAmenity('within100mMetro')} />
                        <Chip icon="TrainFront" label="Within 100m of tram stop" size="lg" selectable isSelected={amenities.within100mTram} onPress={() => toggleAmenity('within100mTram')} />
                        <Chip icon="Bus" label="Within 100m of bus stop" size="lg" selectable isSelected={amenities.within100mBus} onPress={() => toggleAmenity('within100mBus')} />
                        <Chip icon="Snowflake" label="Air conditioning" size="lg" selectable isSelected={amenities.airConditioning} onPress={() => toggleAmenity('airConditioning')} />
                        <Chip icon="Wifi" label="Wifi" size="lg" selectable isSelected={amenities.wifi} onPress={() => toggleAmenity('wifi')} />
                        <Chip icon="Car" label="Parking" size="lg" selectable isSelected={amenities.parking} onPress={() => toggleAmenity('parking')} />
                    </View>
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Additional Options">
                    <View className='mt-4 space-y-4'>
                        <Switch label="Wheelchair accessible" value={options.wheelchairAccessible} onChange={(v) => setOptions((p) => ({ ...p, wheelchairAccessible: v }))} />
                        <Switch label="Air compressors" value={options.airCompressors} onChange={(v) => setOptions((p) => ({ ...p, airCompressors: v }))} />
                        <Switch label="Electrically adjustable chairs" value={options.electricallyAdjustableChairs} onChange={(v) => setOptions((p) => ({ ...p, electricallyAdjustableChairs: v }))} />
                    </View>
                </Section>
            </ThemedScroller>
            <ThemeFooter>
                <Button
                    title="Apply Filters"
                    rounded="full"
                    size="large"
                    className='bg-highlight'
                    textClassName='text-white'
                    onPress={handleApplyFilters}
                />
            </ThemeFooter>
        </>
    );
}

function CounterRow(props: { label: string; value?: number; onChange?: (value: number | undefined) => void }) {
    return (
        <View className='flex-row items-center justify-between py-2'>
            <View>
                <ThemedText className='text-base font-normal'>{props.label}</ThemedText>
            </View>
            <Counter value={props.value} onChange={props.onChange} min={0} max={99} />
        </View>
    );
}
