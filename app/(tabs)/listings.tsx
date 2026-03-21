import React from 'react';

import Header, { HeaderIcon } from '@/components/Header';
import useThemeColors from '@/app/contexts/ThemeColors';
import ThemedScroller from '@/components/ThemeScroller';
import AniamatedView from '@/components/AnimatedView';
import ThemedText from '@/components/ThemedText';
import { Image, Pressable, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { router } from 'expo-router';
import { useTranslation } from '@/app/hooks/useTranslation';

const EmptyScreen = () => {
    const colors = useThemeColors();
    const { t } = useTranslation();


    return (
        <AniamatedView animation="scaleIn" className="flex-1">
            <Header
                title=" "
                //showBackButton
                rightComponents={[<HeaderIcon icon="PlusCircle" href="/screens/add-property-start" />]}
            />
            <ThemedScroller
                className="flex-1 pt-8"
                keyboardShouldPersistTaps="handled"
            >
                <ThemedText className='text-3xl font-semibold'>{t('listingsYourListings')}</ThemedText>
                <View className="flex-row gap-2 mt-2 mb-10">
                    <Chip isSelected size="lg" label={t('tripsFilterAll')} />
                    <Chip size="lg" label={t('listingsHomes')} />
                    <Chip size="lg" label={t('listingsExperiences')} />
                </View>
                <ListingCard title="Apartment in New York" description="Brooklyn, NY" image={require('@/assets/img/barbers.png')} />
                <ListingCard title="House in Barcelona" description="Barcelona, Spain" image={require('@/assets/img/barbers.png')} />
                <ListingCard title="Lofthouse in New York" description="Brooklyn, NY" image={require('@/assets/img/barbers.png')} />
                <ListingCard title="Apartment in New York" description="Brooklyn, NY" image={require('@/assets/img/barbers.png')} />
                <ListingCard title="Beach house" description="Siargao, Philippines" image={require('@/assets/img/barbers.png')} />
                <ListingCard title="Forest house" description="Rocky mountain, USA" image={require('@/assets/img/barbers.png')} />
            </ThemedScroller>
          
        </AniamatedView>
    );
};

const ListingCard = (props: any) => {
    return (
        <Pressable onPress={() => router.push('/screens/product-detail')} className="flex-row gap-2 items-center mb-5">
            <Image className='w-20 h-20 rounded-2xl mr-3' source={props.image} />
            <View>
                <ThemedText className='text-base font-semibold'>{props.title}</ThemedText>
                <ThemedText className='font-light mt-1'>{props.description}</ThemedText>
            </View>
        </Pressable>
    );
};

export default EmptyScreen;