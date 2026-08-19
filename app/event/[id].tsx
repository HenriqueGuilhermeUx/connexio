import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { loadEvent } from '@/lib/events';
import { ConnexioEvent } from '@/types';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

function eventDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member } = useApp();
  const [event, setEvent] = useState<ConnexioEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setEvent(await loadEvent(id));
      } catch (error) {
        Alert.alert('Não foi possível abrir o evento', friendlyError(error));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Screen><LoadingState label="Carregando evento..." /></Screen>;
  if (!event) return <Screen><Text style={styles.title}>Evento não encontrado ou indisponível.</Text></Screen>;

  const contact = async () => {
    if (!event.contactWhatsapp) {
      Alert.alert('Contato indisponível', 'A organização não informou um WhatsApp.');
      return;
    }
    const senderName = member?.name || 'um membro do Connexio';
    const lodge = member?.lodge && member.lodge !== 'Loja a confirmar' ? member.lodge : 'minha Loja Maçônica';
    const lodgeNumber = member?.lodgeNumber ? ` nº ${member.lodgeNumber}` : '';
    const message = `Olá, irmão. Sou ${senderName}, da ${lodge}${lodgeNumber}. Vi o evento “${event.title}” no Connexio e gostaria de mais informações. TFA.`;
    const url = `https://wa.me/${event.contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
  };

  const openTicket = async () => {
    if (!event.ticketUrl) return;
    const url = /^https?:\/\//i.test(event.ticketUrl) ? event.ticketUrl : `https://${event.ticketUrl}`;
    await Linking.openURL(url);
  };

  return (
    <Screen contentStyle={styles.content}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}><Feather name="calendar" size={54} color={colors.gold} /></View>
      )}

      <View style={styles.badges}>
        {event.featured ? <Text style={styles.featured}>EVENTO EM DESTAQUE</Text> : null}
        {event.status !== 'PUBLISHED' ? <Text style={styles.pending}>EM ANÁLISE</Text> : null}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.organizer}>{event.lodgeName}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}><Feather name="calendar" size={18} color={colors.goldSoft} /><Text style={styles.infoText}>{eventDate(event.startsAt)}</Text></View>
        <View style={styles.infoRow}><Feather name="map-pin" size={18} color={colors.goldSoft} /><Text style={styles.infoText}>{event.venue}{event.address ? ` · ${event.address}` : ''}</Text></View>
        <View style={styles.infoRow}><Feather name="navigation" size={18} color={colors.goldSoft} /><Text style={styles.infoText}>{event.city} · {event.region}</Text></View>
        <View style={styles.infoRow}><Feather name="users" size={18} color={colors.goldSoft} /><Text style={styles.infoText}>{event.organizerName}</Text></View>
        <View style={styles.infoRow}><Feather name="tag" size={18} color={colors.goldSoft} /><Text style={styles.infoText}>{event.ticketPrice ? `R$ ${event.ticketPrice.toFixed(2).replace('.', ',')}` : 'Consulte a organização'}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre o evento</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>

      {event.status === 'PUBLISHED' ? <Button label="Falar com a organização no WhatsApp" onPress={() => void contact()} /> : null}
      {event.status === 'PUBLISHED' && event.ticketUrl ? <Button label="Abrir página de ingressos" variant="secondary" onPress={() => void openTicket()} /> : null}

      <Text style={styles.disclaimer}>O Connexio divulga eventos aprovados, mas inscrições, pagamentos e organização são responsabilidade dos realizadores.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  image: { width: '100%', height: 260, borderRadius: 24, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featured: { color: colors.background, backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  pending: { color: colors.goldSoft, backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  title: { color: colors.cream, fontSize: 31, lineHeight: 37, fontWeight: '900' },
  organizer: { color: colors.goldSoft, fontSize: 14, fontWeight: '800' },
  infoCard: { gap: 14, padding: 17, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  infoText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  section: { gap: 9 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 23 },
  disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
