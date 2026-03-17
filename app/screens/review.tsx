import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Avatar from '@/components/Avatar';
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
import { useTranslation } from '@/app/hooks/useTranslation';

const StarRating = ({ rating, setRating }: { rating: number; setRating: (rating: number) => void }) => {
    const colors = useThemeColors();

    const handlePress = (starIndex: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    const { t } = useTranslation();
    const { entityType, entityId, entityName, entityImage, entityEmployeeName, entityEmployeeAvatar } = useLocalSearchParams<{
        entityType?: string;
        entityId?: string;
        entityName?: string;
        entityImage?: string;
        entityEmployeeName?: string;
        entityEmployeeAvatar?: string;
    }>();

    const displayName = entityName ? decodeURIComponent(entityName) : 'Luxury Beachfront Villa';
    const imageUrl = entityImage ? decodeURIComponent(entityImage) : '';
    const employeeName = entityEmployeeName ? decodeURIComponent(entityEmployeeName) : '';
    const employeeAvatarUrl = entityEmployeeAvatar ? decodeURIComponent(entityEmployeeAvatar) : '';
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
            t('reviewDeleteConfirmTitle'),
            t('reviewDeleteConfirmMessage'),
            [
                { text: t('commonNo'), style: 'cancel' },
                {
                    text: t('commonYes'),
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
                title={entityName ? `${t('reviewWriteTo')} ${displayName}` : t('reviewWriteFallback')}
                showBackButton
            />
            <ThemedScroller
                className="flex-1 pt-8"
                keyboardShouldPersistTaps="handled"
            >
                {loadingExisting ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" />
                        <ThemedText className="mt-3 text-sm text-light-subtext dark:text-dark-subtext">{t('commonLoading')}</ThemedText>
                    </View>
                ) : (
                    <>
                {/* Product + employee row */}
                <View className="flex-row justify-center items-stretch gap-4 mb-2 px-2">
                    {/* Service: image + name */}
                    <View className="flex-col items-center flex-1 min-w-0">
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                className="w-24 h-24 rounded-lg bg-light-secondary dark:bg-dark-secondary"
                                resizeMode="cover"
                            />
                        ) : null}
                        <ThemedText className="font-bold mt-2 text-sm text-center" numberOfLines={2}>{displayName}</ThemedText>
                    </View>
                    {/* Employee: avatar + name (only when present) */}
                    {(employeeName || employeeAvatarUrl) ? (
                        <View className="flex-col items-center justify-center flex-1 min-w-0 border-l border-light-border dark:border-dark-border pl-4">
                            <Avatar src={employeeAvatarUrl || undefined} name={employeeName} size="md" />
                            <ThemedText className="font-medium text-sm mt-2 text-center" numberOfLines={2}>{employeeName || '—'}</ThemedText>
                        </View>
                    ) : null}
                </View>

                {/* Star Rating */}
                <StarRating rating={rating} setRating={setRating} />

                {/* Review Input */}
                <Input
                    label={t('reviewWriteYourReview')}
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
                            label={t('reviewAnonymous')}
                            description={t('reviewAnonymousDesc')}
                            value={isAnonymous}
                            onChange={(value) => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                                setIsAnonymous(value);
                            }}
                            className="py-3"
                        />
                    </View>
                )}

                    </>
                )}
            </ThemedScroller>
            <ThemedFooter>
                <View className="flex-row bg-light-secondary dark:bg-dark-secondary rounded-2xl overflow-hidden">
                    {isEditMode ? (
                        <>
                            <Button
                                variant="ghost"
                                size="small"
                                title={t('reviewUpdate')}
                                onPress={handleSubmit}
                                disabled={!canSubmit || submitting || deleting}
                                className={`flex-1 py-3.5 px-0 min-w-0 rounded-none ${!canSubmit || submitting || deleting ? 'opacity-100' : ''}`}
                                textClassName={`text-sm font-semibold ${!canSubmit || submitting || deleting ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}
                            />
                            <View className="w-px self-stretch bg-neutral-200 dark:bg-neutral-700" />
                            <Button
                                variant="ghost"
                                size="small"
                                title={deleting ? t('reviewDeleting') : t('reviewDelete')}
                                onPress={handleDelete}
                                disabled={submitting || deleting}
                                className={`flex-1 py-3.5 px-0 min-w-0 rounded-none ${submitting || deleting ? 'opacity-100' : ''}`}
                                textClassName={`text-sm font-semibold ${submitting || deleting ? 'text-red-400 dark:text-red-500 opacity-70' : 'text-red-600 dark:text-red-400'}`}
                            />
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="small"
                            title={t('reviewSubmit')}
                            onPress={handleSubmit}
                            disabled={!canSubmit || submitting || deleting}
                            className={`flex-1 py-3.5 px-0 rounded-2xl ${!canSubmit || submitting || deleting ? 'opacity-100' : ''}`}
                            textClassName={`text-sm font-semibold ${!canSubmit || submitting || deleting ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'}`}
                        />
                    )}
                </View>
            </ThemedFooter>
        </>
    );
};

export default ReviewScreen;