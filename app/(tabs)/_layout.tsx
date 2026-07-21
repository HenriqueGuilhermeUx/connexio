import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="publish" options={{ title: 'Publicar', tabBarIcon: ({ color, size }) => <Feather name="plus-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoritos', tabBarIcon: ({ color, size }) => <Feather name="heart" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
    </Tabs>
  );
}
