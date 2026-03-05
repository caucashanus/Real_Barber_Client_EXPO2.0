import { Stack } from 'expo-router';

export default function RBCLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'RBC Card' }} />
      <Stack.Screen name="historie" options={{ title: 'Transaction history' }} />
      <Stack.Screen name="design" options={{ title: 'Card designs' }} />
      <Stack.Screen name="design/[designId]" options={{ title: 'Card design' }} />
    </Stack>
  );
}
