import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export async function openExternalUrl(url: string) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const supported = await Linking.canOpenURL(normalized);
  if (!supported) {
    Alert.alert('Link indisponível', 'Não foi possível abrir este endereço.');
    return;
  }
  await Linking.openURL(normalized);
}
