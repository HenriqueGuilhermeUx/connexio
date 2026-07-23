import { AppProvider } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.cream,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Entrar' }} />
        <Stack.Screen name="register" options={{ title: 'Criar conta' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Dados maçônicos' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Recuperar senha' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Nova senha' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacidade' }} />
        <Stack.Screen name="terms" options={{ title: 'Termos de Uso' }} />
        <Stack.Screen name="child-safety" options={{ title: 'Segurança infantil' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Excluir conta' }} />
        <Stack.Screen name="blocked-members" options={{ title: 'Anunciantes bloqueados' }} />
        <Stack.Screen name="events" options={{ title: 'Eventos' }} />
        <Stack.Screen name="create-event" options={{ title: 'Divulgar evento' }} />
        <Stack.Screen name="event/[id]" options={{ title: 'Evento' }} />
        <Stack.Screen name="admin-events" options={{ title: 'Aprovar eventos' }} />
        <Stack.Screen name="pending" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ title: 'Oferta' }} />
        <Stack.Screen name="report/[id]" options={{ title: 'Denunciar oferta' }} />
        <Stack.Screen name="admin" options={{ title: 'Administração' }} />
      </Stack>
    </AppProvider>
  );
}
