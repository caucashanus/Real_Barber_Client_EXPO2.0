import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
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
import { createReview, getEntityReviews, updateReview, deleteReview } from '@/api/reviews';
import Switch from '@/components/forms/Switch';

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
    const [deleting, setDeleting] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
    const [initialRating, setInitialRating] = useState(0);
    const [initialReview, setInitialReview] = useState('');
    const [initialAnonymous, setInitialAnonymous] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);
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
    const isEditMode = existingReviewId != null;
    const isDirty = isEditMode && (
        rating !== initialRating ||
        review.trim() !== initialReview ||
        isAnonymous !== initialAnonymous
    );
    const canSubmit = canSubmitToApi && (
        isEditMode ? (isDirty && rating >= 1 && review.trim().length > 0) : (rating >= 1 && review.trim().length > 0)
    );

    useEffect(() => {
        if (!apiToken || !entityType || !entityId) {
            setLoadingExisting(false);
            return;
        }
        setLoadingExisting(true);
        const type = entityType as 'branch' | 'reservation' | 'item' | 'sale_log' | 'employee';
        const id = decodeURIComponent(entityId);
        getEntityReviews(apiToken, type, id, { limit: 1, includeOwn: true })
            .then((data) => {
                if (data.hasReviewed && data.clientReview) {
                    const cr = data.clientReview;
                    const desc = cr.description ?? cr.positiveFeedback ?? '';
                    setExistingReviewId(cr.id);
                    setRating(cr.rating);
                    setReview(desc);
                    setIsAnonymous(cr.isAnonymous ?? false);
                    setInitialRating(cr.rating);
                    setInitialReview(desc);
                    setInitialAnonymous(cr.isAnonymous ?? false);
                } else {
                    setExistingReviewId(null);
                }
            })
            .catch(() => setExistingReviewId(null))
            .finally(() => setLoadingExisting(false));
    }, [apiToken, entityType, entityId]);

    const handleSubmit = async () => {
        if (!canSubmit || !apiToken) return;
        setSubmitting(true);
        try {
            const allowAnonymous = entityType !== 'sale_log';
            if (existingReviewId) {
                await updateReview(apiToken, existingReviewId, {
                    rating,
                    description: review.trim(),
                    isAnonymous: allowAnonymous ? isAnonymous : false,
                });
            } else if (entityType && entityId) {
                await createReview(apiToken, {
                    entityType: entityType as 'branch' | 'reservation' | 'item' | 'sale_log' | 'employee',
                    entityId: decodeURIComponent(entityId),
                    rating,
                    description: review.trim(),
                    isAnonymous: allowAnonymous ? isAnonymous : false,
                });
            }
            router.back();
        } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save review.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete review',
            'Do you really want to delete this review?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        if (!apiToken || !existingReviewId) return;
                        setDeleting(true);
                        try {
                            await deleteReview(apiToken, existingReviewId);
                            router.back();
                        } catch (e) {
                            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete review.');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
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
                {loadingExisting ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" />
                        <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">Loading…</ThemedText>
                    </View>
                ) : (
                    <>
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

                {/* Anonymous review – not allowed for product (sale_log) reviews */}
                {entityType !== 'sale_log' && (
                    <View className="mt-6">
                        <Switch
                            label="Anonymous review"
                            description="Your name and profile will not be shown with this review."
                            value={isAnonymous}
                            onChange={setIsAnonymous}
                            className="py-3"
                        />
                    </View>
                )}

                    </>
                )}
            </ThemedScroller>
            <ThemedFooter>
                <Button
                    title={isEditMode ? 'Update review' : 'Submit Review'}
                    onPress={handleSubmit}
                    disabled={!canSubmit || submitting || deleting}
                />
                {isEditMode && (
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={submitting || deleting}
                        className="mt-3 py-2"
                        activeOpacity={0.7}
                    >
                        <ThemedText className="text-center text-sm text-red-500 dark:text-red-400">
                            {deleting ? 'Deleting…' : 'Delete review'}
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </ThemedFooter>
        </>
    );
};

export default ReviewScreen;