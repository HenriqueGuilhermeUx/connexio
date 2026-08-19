import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const EAS_PROJECT_ID = 'cdcb129b-043c-4823-be6f-4e7dc0b7ddeb';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerDevicePushToken() {
  if (!supabase || Platform.OS === 'web') return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('connexio-loja', {
      name: 'Connexio · Loja',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permissions = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID })).data;
  const { error } = await supabase.from('device_push_tokens').upsert({
    user_id: auth.user.id,
    expo_push_token: token,
    platform: Platform.OS,
    enabled: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'expo_push_token' });
  if (error) throw error;
  return token;
}
