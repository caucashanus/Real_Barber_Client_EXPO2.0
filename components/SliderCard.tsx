import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

import ImageCarousel from './ImageCarousel';
import ThemedText from './ThemedText';

import useThemeColors from '@/app/contexts/ThemeColors';

interface SliderCardProps {
  title: string;
  description?: string;
  image: string | string[];
  href: string;
  className?: string;
  button?: string;
  rating?: string;
  distance?: any;
  price?: string;
}

const SliderCard = ({
  title,
  description,
  image,
  href,
  rating,
  distance,
  price,
  className = '',
  ...props
}: SliderCardProps) => {
  const colors = useThemeColors();
  const images = Array.isArray(image) ? image : [image];

  return (
    <View
      className={`mb-0 w-full bg-light-primary p-global dark:bg-dark-primary ${className}`}
      {...props}>
      <View className="relative w-full">
        <ImageCarousel
          images={images}
          height={300}
          //width={windowWidth - 32}
          rounded="xl"
          className="rounded-2xl"
        />
      </View>
      <Link href={href} asChild>
        <TouchableOpacity>
          <View className="mt-2 w-full flex-row items-center justify-between">
            <ThemedText variant="emphasis">{title}</ThemedText>
            {rating && (
              <View className="flex-row items-center">
                <MaterialIcons name="star" size={18} color={colors.text} />
                <ThemedText className="ml-px text-base">{rating}</ThemedText>
              </View>
            )}
          </View>
          <Text className="font-archivo text-sm text-light-subtext dark:text-dark-subtext">
            {distance} miles away
          </Text>
          <ThemedText variant="h4" className="mt-2">
            {price} <ThemedText className="font-archivo">night</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default SliderCard;
