import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import Slider from '@react-native-community/slider';
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
    const [minBarbers, setMinBarbers] = useState(1);

    const handleApplyFilters = () => {
        // Handle applying filters here
        router.back();
    };

    return (
        <>
            <Header showBackButton title="Filters" />
            <ThemedScroller className="flex-1 bg-light-primary dark:bg-dark-primary">
               

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Price" subtitle={`Up to $${Math.round(price)} USD`}>
                   
                   <Slider
                       style={{ width: "100%", height: 40 }}
                       value={price}
                       minimumValue={100}
                       maximumValue={1000}
                       onValueChange={setPrice}
                       minimumTrackTintColor="#FF2358"
                       maximumTrackTintColor="rgba(0,0,0,0.2)"
                       step={10}
                   />
               </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Minimum number of barbers" subtitle={`At least ${Math.round(minBarbers)} barber${Math.round(minBarbers) === 1 ? '' : 's'}`}>
                   <Slider
                       style={{ width: "100%", height: 40 }}
                       value={minBarbers}
                       minimumValue={1}
                       maximumValue={20}
                       onValueChange={setMinBarbers}
                       minimumTrackTintColor="#FF2358"
                       maximumTrackTintColor="rgba(0,0,0,0.2)"
                       step={1}
                   />
               </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Amenities and layout">
                    <CounterRow label="Number of chairs" />
                    <CounterRow label="Beds" />
                    <CounterRow label="Bathrooms"  />
                </Section>

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Amenities">
                    <View className='flex-row flex-wrap gap-2 mt-2'>
                        <Chip icon="Wallet" label="Card payment" size="lg" selectable />
                        <Chip icon="Coffee" label="Coffee machine" size="lg" selectable />
                        <Chip icon="CreditCard" label="Self-service checkout" size="lg" selectable />
                        <Chip icon="Train" label="Within 100m of metro" size="lg" selectable />
                        <Chip icon="TrainFront" label="Within 100m of tram stop" size="lg" selectable />
                        <Chip icon="Bus" label="Within 100m of bus stop" size="lg" selectable />
                        <Chip icon="Snowflake" label="Air conditioning" size="lg" selectable />
                        <Chip icon="Wifi" label="Wifi" size="lg" selectable />
                        <Chip icon="Car" label="Parking" size="lg" selectable />
                    </View>
                </Section>

                

                <Section className='mb-7 pb-7 border-b border-light-secondary dark:border-dark-secondary' title="Additional Options">
                    <View className='mt-4 space-y-4'>
                        <Switch
                            label="Wheelchair accessible"
                        />
                        <Switch
                            label="Air compressors"
                        />
                        <Switch
                            label="Electrically adjustable chairs"
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
