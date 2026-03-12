import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Platform } from 'react-native';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import Divider from '@/components/layout/Divider';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function AddPropertyStart() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();



    return (
        <>
            <Header showBackButton />
            <View className=" flex-1 px-6  flex justify-start h-full bg-light-primary dark:bg-dark-primary">
                <View className='pb-6 mt-4'>
                    <ThemedText className='text-4xl font-semibold mb-8'>{t('addPropertyEasyTitle')}</ThemedText>
                </View>

                <IntroStep number="1" title={t('addPropertyStep1Title')} description={t('addPropertyStep1Desc')} image={require('@/assets/img/myidea.png')} />
                <Divider className='my-4' />
                <IntroStep number="2" title={t('addPropertyStep2Title')} description={t('addPropertyStep2Desc')} image={require('@/assets/img/myrules.png')} />
                <Divider className='my-4' />
                <IntroStep number="3" title={t('addPropertyStep3Title')} description={t('addPropertyStep3Desc')} image={require('@/assets/img/savefinish.png')} />
                
                <View className=' pb-2 mt-auto' style={{ paddingBottom: insets.bottom }}>
                    <Button size="large" variant="primary" textClassName='text-white' rounded="full" title={t('addPropertyLetsGo')} href='/screens/add-property' />
                </View>
            </View>
        </>
    );
} 

const IntroStep = (props: { number: string, title: string, description: string, image: any }) => {
    return (
        <View className='flex-row items-start py-4'>
            <ThemedText className='text-lg font-semibold mr-4'>{props.number}</ThemedText>
            <View className='flex-1 mr-6'>
                <ThemedText className='text-lg font-semibold'>{props.title}</ThemedText>
                <ThemedText className='text-sm text-light-subtext dark:text-dark-subtext'>{props.description}</ThemedText>
            </View>
            <Image source={props.image} className='w-24 h-24 ml-auto' />
        </View>
    )
}