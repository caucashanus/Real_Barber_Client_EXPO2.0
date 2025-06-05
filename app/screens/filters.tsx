import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Slider from '@/components/forms/Slider';
import Counter from '@/components/forms/Counter';
import FormTabs, { FormTab } from '@/components/forms/FormTabs';
import { Button } from '@/components/Button';
import ThemedScroller from '@/components/ThemeScroller';
import ThemeFooter from '@/components/ThemeFooter';
import Header from '@/components/Header';
import Section from '@/components/layout/Section';
import { Chip } from '@/components/Chip';
import Switch from '@/components/forms/Switch';

export default function FiltersScreen() {
    const router = useRouter();
    const [price, setPrice] = useState(50);

    const handleApplyFilters = () => {
        // Handle applying filters here
        router.back();
    };

    return (
        <>
            <Header showBackButton title="Filters" />
            <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary">
                <Section className='mb-7 pb-7 mt-8 border-b border-light-secondary dark:border-dark-secondary' title="Type of place">
                    <FormTabs className='mt-4'>
                        <FormTab title="Any type" />
                        <FormTab title="Room" />
                        <FormTab title="Entire place" />
                    </FormTabs>
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Price" subtitle={`Up to $${price} USD`}>
                    <Slider
                        value={price}
                        onValueChange={setPrice}
                        minValue={100}
                        maxValue={1000}
                        step={5}
                        initialValue={500}
                        size="l"
                        className='mt-2'
                    />
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Rooms and beds">
                    <CounterRow label="Bedrooms" />
                    <CounterRow label="Beds" />
                    <CounterRow label="Bathrooms"  />
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Amenities">
                    <View className='flex-row flex-wrap gap-2 mt-2'>
                        <Chip icon="Bed" label="Kitchen" size="lg" selectable />
                        <Chip icon="Snowflake" label="Air conditioning" size="lg" selectable />
                        <Chip icon="Wifi" label="Wifi" size="lg" selectable />
                        <Chip icon="Tv" label="TV" size="lg" selectable />
                        <Chip icon="Car" label="Parking" size="lg" selectable />
                    </View>
                </Section>

                

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Additional Options">
                    <View className='mt-4 space-y-4'>
                        <Switch
                            label="Step free bedroom access"
                        />
                        <Switch
                            label="Shower grab bar"
                        />
                        <Switch
                            label="Disabled paraking spot"
                        />
                        
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


const CounterRow = (props: { label: string }) => {
    return (
        <View className='flex-row items-center justify-between py-2'>
            <View>
                <ThemedText className='text-base font-normal'>{props.label}</ThemedText>
            </View>
            <Counter />
        </View>
    )
}
