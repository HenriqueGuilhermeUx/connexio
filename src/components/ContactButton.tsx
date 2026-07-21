import { Button } from '@/components/Button';
import { Listing } from '@/types';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export function ContactButton({ listing, allowed }: { listing: Listing; allowed: boolean }) {
  const open = async () => {
    if (!allowed) {
      Alert.alert('Contato protegido', 'Os contatos serão liberados quando seu cadastro for aprovado.');
      return;
    }
    if (!listing.phone) {
      Alert.alert('Contato indisponível', 'O ofertante ainda não informou um WhatsApp.');
      return;
    }
    const message = `Olá, ${listing.ownerName}. Vi sua oferta “${listing.title}” no Connexio e gostaria de mais informações.`;
    const url = `https://wa.me/${listing.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o contato neste dispositivo.');
      return;
    }
    await Linking.openURL(url);
  };

  return <Button label={allowed ? 'Falar no WhatsApp' : 'Contato após validação'} variant={allowed ? 'primary' : 'secondary'} onPress={() => void open()} />;
}
