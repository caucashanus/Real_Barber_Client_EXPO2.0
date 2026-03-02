import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import useThemeColors from '@/app/contexts/ThemeColors';
import Input from '@/components/forms/Input';
import ThemedScroller from '@/components/ThemeScroller';
import ThemedFooter from '@/components/ThemeFooter';
import { useAuth } from '@/app/contexts/AuthContext';
import { createReview } from '@/api/reviews';

const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
    const colors = useThemeColors();

    const handlePress = (starIndex: number) => {
        const newRating = starIndex + 1;
        setRating(newRating === rating ? 0 : newRating);
    };

    return (
        <View className="flex-row justify-center my-6">
            {[0, 1, 2, 3, 4].map((starIndex) => (
                <TouchableOpacity
                    key={starIndex}
                    onPress={() => handlePress(starIndex)}
                    className="w-10 h-10 justify-center items-center">
                    <FontAwesome
                        name={rating > starIndex ? 'star' : 'star-o'}
                        size={30}
                        color={rating > starIndex ? colors.icon : colors.text}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const ReviewScreen = () => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const colors = useThemeColors();
    const { apiToken } = useAuth();
    const { entityType, entityId, entityName, entityImage } = useLocalSearchParams<{
        entityType?: string;
        entityId?: string;
        entityName?: string;
        entityImage?: string;
    }>();

    const displayName = entityName ? decodeURIComponent(entityName) : 'Luxury Beachfront Villa';
    const imageUrl = entityImage ? decodeURIComponent(entityImage) : '';
    const canSubmitToApi = Boolean(apiToken && entityType && entityId);

    const handleSubmit = async () => {
        if (canSubmitToApi && apiToken && entityType && entityId) {
            setSubmitting(true);
            try {
                await createReview(apiToken, {
                    entityType: entityType as 'branch' | 'reservation' | 'item' | 'sale_log' | 'employee',
                    entityId: decodeURIComponent(entityId),
                    rating,
                    description: review.trim(),
                });
                router.back();
            } catch (e) {
                Alert.alert('Chyba', e instanceof Error ? e.message : 'Nepodařilo se odeslat recenzi.');
            } finally {
                setSubmitting(false);
            }
        } else {
            console.log({ rating, review });
            router.back();
        }
    };

    return (
        <>


            <Header
                title="Write a Review"
                showBackButton
            />
            <ThemedScroller
                className="flex-1 pt-8"
                keyboardShouldPersistTaps="handled"
            >
                {/* Product image + name */}
                <View className="flex-col items-center mb-0">
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            className="w-32 h-32 rounded-lg bg-light-secondary dark:bg-dark-secondary"
                            resizeMode="cover"
                        />
                    ) : null}
                    <View className="flex-1 items-center justify-center">
                        <ThemedText className="font-bold mt-global text-base">{displayName}</ThemedText>
                    </View>
                </View>

                {/* Star Rating */}
                <StarRating rating={rating} setRating={setRating} />

                {/* Review Input */}
                <Input
                    label='Write your review'
                    isMultiline
                    style={{
                        textAlignVertical: 'top',
                        height: 120
                    }}
                    value={review}
                    onChangeText={setReview}
                />


            </ThemedScroller>
            <ThemedFooter>
                <Button
                    title="Submit Review"
                    onPress={handleSubmit}
                    disabled={rating === 0 || !review.trim() || submitting}
                />
            </ThemedFooter>
        </>
    );
};

export default ReviewScreen;