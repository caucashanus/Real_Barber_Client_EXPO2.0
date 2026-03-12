import React from 'react';

import Header from '@/components/Header';
import useThemeColors from '@/app/contexts/ThemeColors';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedFooter from '@/components/ThemeFooter';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import { View } from 'react-native';
import { shadowPresets } from '@/utils/useShadow';
import Icon from '@/components/Icon';
import Grid from '@/components/layout/Grid';
import { useTranslation } from '@/app/hooks/useTranslation';

const InsightsScreen = () => {
    const colors = useThemeColors();
    const { t } = useTranslation();


    return (
        <>
            <Header
                title=" "
                showBackButton
            />
            <ThemedScroller className="flex-1" keyboardShouldPersistTaps="handled">
                <Section title={t('insightsTitle')} titleSize='3xl' className='py-10' />
                <Grid columns={2} spacing={10}>
                    <InsightCard icon="Calendar" title={t('insightsLongerStays')} percentage={25} amount="1/4" />
                    <InsightCard icon="WashingMachine" title={t('insightsAmenities')} percentage={50} amount="2/4" />
                    <InsightCard icon="SlidersHorizontal" title={t('insightsFlexibleStays')} percentage={75} amount="3/4" />
                    <InsightCard icon="Users" title={t('insightsFamilyTravel')} percentage={50} amount="2/4" />
                    <InsightCard icon="Waves" title={t('insightsBeachfront')} percentage={25} amount="1/4" />
                    <InsightCard icon="Dog" title={t('insightsPetFriendly')} percentage={50} amount="2/4" />
                    <InsightCard icon="Home" title={t('insightsStar')} percentage={75} amount="3/4" />
                </Grid>
            </ThemedScroller>
        </>
    );
};

const InsightCard = (props: any) => {
    const colors = useThemeColors();
    return (
        <View
            style={{ ...shadowPresets.large }}
            className='bg-light-primary dark:bg-dark-secondary rounded-3xl p-4'>
            <Icon name={props.icon} size={20} strokeWidth={2} color="white" style={{ backgroundColor: colors.highlight }} className='w-12 h-12 rounded-full mb-20' />
            <ThemedText className='text-xl font-semibold mb-1'>{props.title}</ThemedText>
            <View className='flex-row items-center w-full'>
                <View className='h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-1 mr-3' >
                    <View style={{ backgroundColor: colors.highlight, width: `${props.percentage}%` }} className='h-full rounded-full' />
                </View>
                <ThemedText className='text-sm opacity-50'>{props.amount}</ThemedText>
            </View>
        </View>
    )
}


export default InsightsScreen;