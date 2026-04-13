import { Link } from 'expo-router';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

import useThemeColors from '@/app/contexts/ThemeColors';
import { useTranslation } from '@/app/hooks/useTranslation';
import Avatar from '@/components/Avatar';
import Header from '@/components/Header';
import ThemedText from '@/components/ThemedText';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

// Mock data for demonstration
const mockChats: ChatUser[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastMessage:
      'Hey, how are you doing? Just checking in to see if you received the files I sent.',
    timestamp: '2m ago',
    unread: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'The meeting has been rescheduled to tomorrow at 2 PM.',
    timestamp: '1h ago',
    unread: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Thanks for your help!',
    timestamp: '2h ago',
    unread: false,
  },
  // Add more mock data as needed
];

export default function ChatListScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const renderChatItem = ({ item }: { item: ChatUser }) => (
    <Link href={`/screens/chat/${item.id}`} asChild>
      <TouchableOpacity
        className={`flex-row items-center border-b border-light-secondary p-4 dark:border-dark-secondary ${item.unread ? 'bg-light-secondary/10 dark:bg-dark-secondary/10' : ''}`}>
        <Avatar size="md" src={item.avatar} name={item.name} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <ThemedText className="text-base font-medium">{item.name}</ThemedText>
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              {item.timestamp}
            </ThemedText>
          </View>
          <View className="mt-1 flex-row items-center">
            <ThemedText
              numberOfLines={1}
              className={`flex-1 pr-10 text-sm ${item.unread ? 'font-medium text-black dark:text-white' : 'text-light-subtext dark:text-dark-subtext'}`}>
              {item.lastMessage}
            </ThemedText>
            {item.unread && (
              <View
                style={{ backgroundColor: colors.highlight }}
                className="ml-2 h-2 w-2 rounded-full"
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header title={t('chatMessages')} showBackButton />
      <FlatList
        data={mockChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}
