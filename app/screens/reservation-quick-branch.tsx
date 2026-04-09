import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { getBranches, type Branch } from '@/api/branches';
import { useAuth } from '@/app/contexts/AuthContext';
import Header from '@/components/Header';
import Icon from '@/components/Icon';
import ThemeScroller from '@/components/ThemeScroller';
import ThemedText from '@/components/ThemedText';
import { List } from '@/components/layout/List';
import ListItem from '@/components/layout/ListItem';

const LAST_BRANCH_KEY = '@rb_last_branch';

type LastBranch = {
  id: string;
  name: string;
  address?: string | null;
};

function normalizeBranches(list: Branch[]): Branch[] {
  return Array.isArray(list) ? list : [];
}

function matchesQuery(branch: Branch, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const name = String(branch.name ?? '').toLowerCase();
  const address = String(branch.address ?? '').toLowerCase();
  return name.includes(query) || address.includes(query);
}

export default function ReservationQuickBranchScreen() {
  const { apiToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState('');
  const [lastBranch, setLastBranch] = useState<LastBranch | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_BRANCH_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as LastBranch;
          if (parsed?.id && parsed?.name) setLastBranch(parsed);
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!apiToken) {
      setBranches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getBranches(apiToken)
      .then((list) => setBranches(normalizeBranches(list)))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [apiToken]);

  const filtered = useMemo(() => branches.filter((b) => matchesQuery(b, query)), [branches, query]);

  const handlePickBranch = async (b: Branch) => {
    const next: LastBranch = { id: b.id, name: b.name, address: b.address ?? null };
    setLastBranch(next);
    AsyncStorage.setItem(LAST_BRANCH_KEY, JSON.stringify(next)).catch(() => {});

    // For now: continue into existing reservation flow, prefilling can be added next.
    router.push('/screens/reservation-create-start');
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header
        title="Vyberte pobočku"
        leftComponent={
          <Pressable onPress={() => router.back()} className="mr-2">
            <Icon name="X" size={22} />
          </Pressable>
        }
      />

      <ThemeScroller className="flex-1" contentContainerStyle={{ paddingTop: 8 }}>
        <View className="px-global">
          {/* Last visit row */}
          {lastBranch ? (
            <View className="-mx-global px-0">
              <Pressable
                onPress={() => setQuery(lastBranch.name)}
                className="rounded-2xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary">
                <View className="flex-row items-center gap-3">
                  <View className="h-3 w-3 rounded-full bg-indigo-500" />
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-sm font-semibold">{lastBranch.name}</ThemedText>
                    {lastBranch.address ? (
                      <ThemedText
                        numberOfLines={1}
                        className="mt-0.5 text-xs text-light-subtext dark:text-dark-subtext">
                        {lastBranch.address}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </View>
          ) : null}

          {/* Search row with map icon */}
          <View className="-mx-global mt-3 px-0">
            <View className="flex-row items-center rounded-2xl bg-light-secondary px-4 py-3 dark:bg-dark-secondary">
              <Icon name="Search" size={18} className="text-light-subtext dark:text-dark-subtext" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Hledat pobočku"
                placeholderTextColor="rgba(120,120,120,0.9)"
                className="ml-2 flex-1 text-base text-light-text dark:text-dark-text"
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Pressable onPress={() => router.push('/screens/map')} hitSlop={10} className="ml-2">
                <Icon name="Map" size={20} className="text-light-subtext dark:text-dark-subtext" />
              </Pressable>
            </View>
          </View>

          {/* Branches list */}
          <View className="-mx-global mt-3 px-0">
            <View className="rounded-2xl bg-light-secondary p-2 dark:bg-dark-secondary">
              {loading ? (
                <View className="items-center py-10">
                  <ActivityIndicator size="small" />
                  <ThemedText className="mt-2 text-sm text-light-subtext dark:text-dark-subtext">
                    Načítám pobočky…
                  </ThemedText>
                </View>
              ) : (
                <List variant="divided" spacing={10}>
                  {filtered.map((b) => (
                    <ListItem
                      key={b.id}
                      leading={
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-light-primary dark:bg-dark-primary">
                          <Icon
                            name="Clock"
                            size={18}
                            className="text-light-subtext dark:text-dark-subtext"
                          />
                        </View>
                      }
                      title={b.name}
                      subtitle={b.address ?? ''}
                      onPress={() => handlePickBranch(b)}
                    />
                  ))}
                </List>
              )}
            </View>
          </View>
        </View>
      </ThemeScroller>
    </View>
  );
}
