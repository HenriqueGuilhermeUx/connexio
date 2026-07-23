import { Button } from '@/components/Button';
import { EventCard } from '@/components/EventCard';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionHeader } from '@/components/SectionHeader';
import { useApp } from '@/context/AppContext';
import { eventMatchesMember, loadEvents } from '@/lib/events';
import { friendlyError } from '@/lib/errors';
import { ConnexioEvent } from '@/types';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function EventsScreen() {
  const { member } = useApp();
  const [events, setEvents] = useState<ConnexioEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await loadEvents());
    } catch (error) {
      Alert.alert('Não foi possível carregar os eventos', friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regional = useMemo(
    () => events.filter((event) => event.status === 'PUBLISHED' && eventMatchesMember(event, member?.city, member?.region)),
    [events, member?.city, member?.region],
  );
  const own = useMemo(
    () => events.filter((event) => event.organizerId === member?.id && event.status !== 'PUBLISHED'),
    [events, member?.id],
  );

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="AGENDA CONNEXIO"
        title="Eventos da irmandade"
        subtitle="Jantares, encontros, campanhas e atividades aprovadas para sua região."
      />

      {member?.status === 'APPROVED' ? (
        <Button label="Divulgar um evento" onPress={() => router.push('/create-event')} />
      ) : (
        <View style={styles.notice}>
          <Feather name="shield" size={21} color={colors.goldSoft} />
          <Text style={styles.noticeText}>A divulgação de eventos é liberada após a aprovação do cadastro.</Text>
        </View>
      )}

      <SectionHeader
        title={member?.region ? `Próximos eventos em ${member.region}` : 'Próximos eventos'}
        subtitle={`${regional.length} ${regional.length === 1 ? 'evento disponível' : 'eventos disponíveis'}`}
      />

      {loading ? (
        <LoadingState label="Carregando agenda..." />
      ) : regional.length ? (
        <View style={styles.list}>
          {regional.map((event) => <EventCard key={event.id} event={event} />)}
        </View>
      ) : (
        <View style={styles.empty}>
          <Feather name="calendar" size={28} color={colors.goldSoft} />
          <Text style={styles.emptyTitle}>Nenhum evento publicado para sua região</Text>
          <Text style={styles.emptyText}>Novos eventos aparecerão aqui após a aprovação administrativa.</Text>
        </View>
      )}

      {own.length ? (
        <View style={styles.section}>
          <SectionHeader title="Meus eventos em análise" subtitle="A equipe revisará os dados antes da divulgação." />
          <View style={styles.list}>
            {own.map((event) => <EventCard key={event.id} event={event} compact />)}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  list: { gap: 15 },
  section: { gap: 15 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  noticeText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', gap: 10, padding: 24, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.cream, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
