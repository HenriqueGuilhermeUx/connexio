import { AdminEmpty } from '@/components/AdminEmpty';
import { AdminEventCard } from '@/components/AdminEventCard';
import { AdminGuard } from '@/components/AdminGuard';
import { LoadingState } from '@/components/LoadingState';
import { RefreshButton } from '@/components/RefreshButton';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { AdminEventQueueRecord, loadAdminEventQueue, reviewEvent } from '@/lib/events';
import { friendlyError } from '@/lib/errors';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<AdminEventQueueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ id: string; decision: 'PUBLISHED' | 'REJECTED' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await loadAdminEventQueue());
    } catch (error) {
      Alert.alert('Não foi possível carregar os eventos', friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (
    event: AdminEventQueueRecord,
    decision: 'PUBLISHED' | 'REJECTED',
    reason: string,
    featured: boolean,
  ) => {
    if (decision === 'REJECTED' && !reason.trim()) {
      Alert.alert('Motivo necessário', 'Explique por que o evento foi rejeitado.');
      return;
    }

    setBusy({ id: event.id, decision });
    try {
      await reviewEvent(event.id, decision, reason, featured);
      await load();
      Alert.alert(
        decision === 'PUBLISHED' ? 'Evento publicado' : 'Evento rejeitado',
        decision === 'PUBLISHED'
          ? 'O evento já pode aparecer para os membros e a notificação regional foi solicitada.'
          : event.title,
      );
    } catch (error) {
      Alert.alert('Não foi possível registrar a decisão', friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AdminGuard>
        <View style={styles.heading}>
          <ScreenTitle
            eyebrow="AGENDA"
            title="Moderação de eventos"
            subtitle="Confira data, local, organizador, alcance e contato antes de publicar e disparar e-mails."
          />
          <RefreshButton loading={loading} onPress={() => void load()} />
        </View>

        {loading ? (
          <LoadingState label="Carregando eventos em análise..." />
        ) : events.length ? (
          <View style={styles.list}>
            {events.map((event) => (
              <AdminEventCard
                key={event.id}
                event={event}
                busy={busy?.id === event.id ? busy.decision : undefined}
                onDecision={(decision, reason, featured) => void decide(event, decision, reason, featured)}
              />
            ))}
          </View>
        ) : (
          <AdminEmpty label="Não há eventos aguardando aprovação." />
        )}
      </AdminGuard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  heading: { gap: 14 },
  list: { gap: 15 },
});
