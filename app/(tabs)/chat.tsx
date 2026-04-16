import { Link } from 'expo-router';
import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Image } from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useCollapsibleTitle } from '@/app/hooks/useCollapsibleTitle';
import { useTranslation } from '@/app/hooks/useTranslation';
import AnimatedView from '@/components/AnimatedView';
import Avatar from '@/components/Avatar';
import { CardScroller } from '@/components/CardScroller';
import { Chip } from '@/components/Chip';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';
import Section from '@/components/layout/Section';

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  propertyImage?: string;
  destination?: string;
  dates?: string;
  type: 'host' | 'guest' | 'support';
}

// Mock data for demonstration
const mockChats: ChatUser[] = [
  {
    id: '1',
    name: 'Sarah (Host)',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastMessage: '',
    timestamp: '2m ago',
    unread: true,
    propertyImage: '',
    destination: '',
    dates: 'Dec 15-22',
    type: 'host',
  },
  {
    id: '2',
    name: 'Michael (Host)',
    avatar: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'Thanks for staying! Hope you enjoyed your time in Paris.',
    timestamp: '1h ago',
    unread: false,
    propertyImage:
      'https://images.pexels.com/photos/1571457/pexels-photo-1571457.jpeg?auto=compress&cs=tinysrgb&w=400',
    destination: 'Paris, France',
    dates: 'Nov 8-15',
    type: 'host',
  },
  {
    id: '3',
    name: 'Emma (Guest)',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: "Hi! I'll be arriving around 6 PM. Is that okay for check-in?",
    timestamp: '3h ago',
    unread: true,
    destination: 'Your place in NYC',
    dates: 'Dec 20-27',
    type: 'guest',
  },
  {
    id: '4',
    name: 'David (Host)',
    avatar: 'https://i.pravatar.cc/150?img=4',
    lastMessage: 'The WiFi password is "welcome123". Enjoy your stay!',
    timestamp: '5h ago',
    unread: false,
    propertyImage:
      'https://images.pexels.com/photos/1571467/pexels-photo-1571467.jpeg?auto=compress&cs=tinysrgb&w=400',
    destination: 'London, UK',
    dates: 'Oct 12-19',
    type: 'host',
  },
  {
    id: '5',
    name: 'Airbnb Support',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: "We've processed your refund. It should appear in 3-5 business days.",
    timestamp: 'Yesterday',
    unread: false,
    type: 'support',
  },
  {
    id: '6',
    name: 'Lisa (Host)',
    avatar: 'https://i.pravatar.cc/150?img=6',
    lastMessage: 'The apartment is ready for your arrival. See you soon!',
    timestamp: '2 days ago',
    unread: true,
    propertyImage:
      'https://images.pexels.com/photos/1571472/pexels-photo-1571472.jpeg?auto=compress&cs=tinysrgb&w=400',
    destination: 'Rome, Italy',
    dates: 'Jan 5-12',
    type: 'host',
  },
  {
    id: '7',
    name: 'Airbnb Support',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: "We've processed your refund. It should appear in 3-5 business days.",
    timestamp: 'Yesterday',
    unread: false,
    type: 'support',
  },
  {
    id: '8',
    name: 'Lisa (Host)',
    avatar: 'https://i.pravatar.cc/150?img=6',
    lastMessage: 'The apartment is ready for your arrival. See you soon!',
    timestamp: '2 days ago',
    unread: true,
    propertyImage:
      'https://images.pexels.com/photos/1571472/pexels-photo-1571472.jpeg?auto=compress&cs=tinysrgb&w=400',
    destination: 'Rome, Italy',
    dates: 'Jan 5-12',
    type: 'host',
  },
];

type FilterType = 'all' | 'read' | 'unread';

export default function ChatListScreen() {
  const colors = useThemeColors();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { t } = useTranslation();
  const { scrollY, onScroll, scrollEventThrottle } = useCollapsibleTitle();
  // Filter chats based on selection
  const filteredChats = mockChats.filter((chat) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'read') return !chat.unread;
    if (selectedFilter === 'unread') return chat.unread;
    return true;
  });

  // Count messages by filter type
  const unreadCount = mockChats.filter((chat) => chat.unread).length;
  const readCount = mockChats.filter((chat) => !chat.unread).length;

  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <Link href={`/screens/chat/${item.id}`} asChild>
      <TouchableOpacity
        activeOpacity={0.8}
        className="flex-row border-b border-light-secondary p-4 dark:border-dark-secondary">
        {/* Property Image or Avatar */}
        <View className="relative">
          {item.propertyImage ? (
            <View className="relative">
              <Image source={{ uri: item.propertyImage }} className="h-16 w-16 rounded-xl" />
              <View className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 border-white dark:border-dark-primary">
                <Image source={{ uri: item.avatar }} className="h-7 w-7 rounded-full" />
              </View>
            </View>
          ) : (
            <Avatar size="lg" src={item.avatar} name={item.name} />
          )}
        </View>

        {/* Content */}
        <View className="ml-5 flex-1">
          {/* Name and Time */}
          <View className="mb-1 flex-row items-center justify-between">
            <ThemedText className="text-base font-medium" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <View className="flex-row items-center">
              <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                {item.timestamp}
              </ThemedText>
              {item.unread && (
                <View
                  style={{ backgroundColor: colors.highlight }}
                  className="ml-2 h-2 w-2 rounded-full"
                />
              )}
            </View>
          </View>

          {/* Message */}
          <ThemedText
            numberOfLines={1}
            className={`mb-1 text-sm ${item.unread ? 'font-medium text-black dark:text-white' : 'text-light-subtext dark:text-dark-subtext'}`}>
            {item.lastMessage}
          </ThemedText>

          {/* Destination and Dates */}
          {item.destination && (
            <View className="flex-row items-center justify-start">
              <ThemedText
                className="text-xs text-light-subtext dark:text-dark-subtext"
                numberOfLines={1}>
                {item.destination}
              </ThemedText>
              <View className="mx-1 h-px w-px rounded-full bg-light-subtext dark:bg-dark-subtext" />
              {item.dates && (
                <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
                  {item.dates}
                </ThemedText>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <>
      <Header title={t('chatTitle')} variant="collapsibleTitle" scrollY={scrollY} />
      <View className="flex-1 bg-light-primary dark:bg-dark-primary">
        <AnimatedView animation="scaleIn" className="flex-1">
          <View className="px-4 py-0">
            <CardScroller className="mb-2" space={5}>
              <Chip
                label={t('notificationsAll')}
                size="lg"
                isSelected={selectedFilter === 'all'}
                onPress={() => setSelectedFilter('all')}
              />
              <Chip
                label={`Unread (${unreadCount})`}
                size="lg"
                isSelected={selectedFilter === 'unread'}
                onPress={() => setSelectedFilter('unread')}
              />
              <Chip
                label={`Read (${readCount})`}
                size="lg"
                isSelected={selectedFilter === 'read'}
                onPress={() => setSelectedFilter('read')}
              />
            </CardScroller>
          </View>

          <FlatList
            className="pb-80"
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            ListFooterComponent={<View className="h-52" />}
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </AnimatedView>
      </View>
    </>
  );
}
