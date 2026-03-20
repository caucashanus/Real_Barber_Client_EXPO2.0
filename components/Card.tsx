import { Link, router } from 'expo-router';
import { View, Text, Image, Pressable, ImageBackground, TouchableOpacity, ViewStyle, Dimensions, ImageSourcePropType, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from './ThemedText';
import { Button } from './Button';
import useShadow, { shadowPresets } from '@/utils/useShadow';
import Icon from './Icon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import useThemeColors from '@/app/contexts/ThemeColors';
import Favorite from './Favorite';
const { width: windowWidth } = Dimensions.get('window');
interface CardProps {
    title: string;
    description?: string;
    hasShadow?: boolean;
    image: string | ImageSourcePropType;
    href?: string;
    onPress?: () => void;
    variant?: 'classic' | 'overlay' | 'compact' | 'minimal';
    className?: string;
    button?: string;
    onButtonPress?: () => void;
    price?: string;
    rating?: number;
    badge?: string;
    /** Second pill (same style as price pill), e.g. payment method */
    badgeSecondary?: string;
    badgeColor?: string;
    icon?: string;
    iconColor?: string;
    imageHeight?: number;
    showOverlay?: boolean;
    hasFavorite?: boolean;
    /** When set with hasFavorite, syncs heart with API (branch / employee / item) */
    favoriteEntityType?: string;
    favoriteEntityId?: string;
    overlayGradient?: readonly [string, string];
    width?: any;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Renders to the right of the title (e.g. live indicator) */
    titleTrailing?: React.ReactNode;
    /** Renders in top-left corner over image (same position as badge "New") */
    topLeftBadge?: React.ReactNode;
    /** Custom content for the pill under title (replaces price/rating/badgeSecondary when set) */
    pillContent?: React.ReactNode;
    children?: React.ReactNode;
    style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({
    title,
    description,
    image,
    hasShadow = false,
    href,
    onPress,
    variant = 'classic',
    className = 'w-full',
    button,
    onButtonPress,
    price,
    rating,
    badge,
    badgeSecondary,
    hasFavorite = false,
    favoriteEntityType,
    favoriteEntityId,
    badgeColor = '#000000',
    imageHeight = 200,
    showOverlay = true,
    overlayGradient = ['transparent', 'rgba(0,0,0,0.3)'] as readonly [string, string],
    rounded = 'lg',
    width = '100%',
    titleTrailing,
    topLeftBadge,
    pillContent,
    children,
    style,
    ...props
}) => {
    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    const getRoundedClass = () => {
        switch (rounded) {
            case 'none': return 'rounded-none';
            case 'sm': return 'rounded-sm';
            case 'md': return 'rounded-md';
            case 'lg': return 'rounded-lg';
            case 'xl': return 'rounded-xl';
            case '2xl': return 'rounded-2xl';
            case 'full': return 'rounded-full';
            default: return 'rounded-lg';
        }
    };

    const renderBadge = () => {
        if (!badge) return null;
        return (
            <View
                className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full bg-white/70 dark:bg-black/70 `}
            >
                <ThemedText className=" text-xs font-medium">{badge}</ThemedText>
            </View>
        );
    };
    const colors = useThemeColors();
    const renderRating = () => {
        if (!rating) return null;
        return (
            <View className="flex-row items-center ">
                <MaterialIcons name="star" size={10} color={colors.text} />
                <ThemedText className="text-xs ml-0 text-gray-500 dark:text-gray-300">{Number(rating).toFixed(1)}</ThemedText>
            </View>
        );
    };

    const renderPrice = () => {
        if (!price) return null;
        return (
            <ThemedText className={`text-xs  ${variant === 'overlay' ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}>{price}</ThemedText>
        );
    };

    const renderContent = () => {
        const resolvedOuterStyle = StyleSheet.flatten([
            width != null ? { width } : null,
            ...(Array.isArray(style) ? style : style != null ? [style] : []),
        ]);

        const cardContent = (
            <View 
            
            className={`flex-1 ${className}`} 
            style={[
                hasShadow && { 
                    ...shadowPresets.small
                },
                style
            ]}>
                <View className="relative">
                    {hasFavorite && (
                        <View className='absolute top-3 right-3 z-50'>
                            <Favorite
                                initialState={false}
                                isWhite
                                productName={title}
                                title={title}
                                entityType={favoriteEntityType}
                                entityId={favoriteEntityId}
                                size={24}
                            />
                        </View>
                    )}
                    {variant === 'overlay' ? (
                        <ImageBackground
                            source={typeof image === 'string' ? { uri: image } : image}
                            className={`w-full overflow-hidden ${getRoundedClass()}`}
                            style={{ height: imageHeight || 200 }}
                        >
                            {showOverlay && (
                                <LinearGradient
                                    colors={overlayGradient}
                                    className='w-full h-full relative flex flex-col justify-end'
                                >
                                    <View className="p-4 absolute bottom-0 left-0 right-0">
                                        <Text className="text-base font-bold text-white">{title}</Text>
                                        {description && (
                                            <Text numberOfLines={1} className="text-xs text-white">{description}</Text>
                                        )}
                                        {(price || rating) && (
                                            <View className="flex-row items-center mt-1 justify-start">
                                                {renderPrice()}
                                                {renderRating()}
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            )}
                        </ImageBackground>
                    ) : (
                        <View className={`${getRoundedClass()} bg-neutral-200 dark:bg-dark-secondary `} style={shadowPresets.small}>
                            <Image
                                source={typeof image === 'string' ? { uri: image } : image}
                                className={`w-full ${getRoundedClass()}`}
                                style={{ height: imageHeight || 200 }}
                            />
                            {children}
                        </View>
                    )}
                    {renderBadge()}
                    {topLeftBadge != null ? (
                        <View className="absolute top-2 left-2 z-10">
                            {topLeftBadge}
                        </View>
                    ) : null}
                </View>

                {variant !== 'overlay' && (
                    <View className="py-2 w-full flex-1 ">
                        <View className="flex-row items-center gap-1">
                            <ThemedText className="text-sm font-medium flex-1 min-w-0" numberOfLines={1}>{title}</ThemedText>
                            {rating ? (
                                <View className="flex-row items-center bg-light-secondary dark:bg-dark-secondary rounded-full px-1.5 py-0.5">
                                    {renderRating()}
                                </View>
                            ) : null}
                            {titleTrailing}
                        </View>

                        {description && (
                            <ThemedText numberOfLines={1} className="text-xs mb-px text-gray-500 dark:text-gray-300">
                                {description}
                            </ThemedText>
                        )}
                        {(price || badgeSecondary || pillContent) && (
                            <View className="flex-row items-center mt-1 flex-wrap gap-1">
                                {pillContent ? (
                                    <View className="flex-row items-center bg-light-secondary dark:bg-dark-secondary rounded-full px-1.5 py-0.5 gap-1">
                                        {pillContent}
                                    </View>
                                ) : null}
                                {!pillContent && price ? (
                                    <View className="flex-row items-center bg-light-secondary dark:bg-dark-secondary rounded-full px-2 py-1">
                                        {renderPrice()}
                                    </View>
                                ) : null}
                                {!pillContent && badgeSecondary ? (
                                    <View className="bg-light-secondary dark:bg-dark-secondary rounded-full px-2 py-1">
                                        <ThemedText className="text-xs text-gray-500 dark:text-gray-300">{badgeSecondary}</ThemedText>
                                    </View>
                                ) : null}
                            </View>
                        )}
                        
                        {button && (
                            <Button
                                className='mt-3'
                                title={button}
                                size='small'
                                onPress={onButtonPress}
                            />
                        )}
                    </View>
                )}
            </View>
        );

        if (href) {
            return (
                <TouchableOpacity
                    className={`${variant === 'overlay' ? '!h-auto' : ''} ${className}`}
                    activeOpacity={0.8}
                    onPress={() => router.push(href)}
                    style={resolvedOuterStyle}
                >
                    {cardContent}
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                className={`${variant === 'overlay' ? '!h-auto' : ''} ${className}`}
                activeOpacity={0.8}
                onPress={handlePress}
                style={resolvedOuterStyle}
            >
                {cardContent}
            </TouchableOpacity>
        );
    };

    return renderContent();
};

export default Card;