import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { AdminEventQueueRecord } from '@/lib/events';
import { colors } from '@/theme/colors';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export function AdminEventCard({
  event,
  busy,
  onDecision,
}: {
  event: AdminEventQueueRecord;
  busy?: 'PUBLISHED' | 'REJECTED';
  onDecision: (decision: 'PUBLISHED' | 'REJECTED', reason: string, featured: boolean) => void;
}) {
  const [reason, setReason] = useState('');
  const [featured, setFeatured] = useState(false);
  const date = new Date(event.starts_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>{event.lodge_name} · {event.organizer_name}</Text>
        </View>
        <Text style={styles.scope}>{event.audience_scope}</Text>
      </View>

      <Text style={styles.description}>{event.description}</Text>
      <View style={styles.data}>
        <Text style={styles.dataText}><Text style={styles.bold}>Data:</Text> {date}</Text>
        <Text style={styles.dataText}><Text style={styles.bold}>Local:</Text> {event.venue}{event.address ? ` · ${event.address}` : ''}</Text>
        <Text style={styles.dataText}><Text style={styles.bold}>Cidade:</Text> {event.city} · {event.region}</Text>
        <Text style={styles.dataText}><Text style={styles.bold}>WhatsApp:</Text> {event.contact_whatsapp}</Text>
      </View>

      <View style={styles.featuredRow}>
        <View style={styles.featuredCopy}>
          <Text style={styles.featuredTitle}>Destacar na abertura</Text>
          <Text style={styles.featuredText}>Eventos em destaque aparecem primeiro para os membros da região.</Text>
        </View>
        <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: colors.gold }} />
      </View>

      <FormField
        label="Observação da análise"
        value={reason}
        onChangeText={setReason}
        multiline
        placeholder="Obrigatória para rejeição; opcional para aprovação."
      />

      <View style={styles.actions}>
        <View style={styles.action}><Button label="Aprovar e publicar" onPress={() => onDecision('PUBLISHED', reason, featured)} loading={busy === 'PUBLISHED'} /></View>
        <View style={styles.action}><Button label="Rejeitar" variant="danger" onPress={() => onDecision('REJECTED', reason, false)} loading={busy === 'REJECTED'} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 15, padding: 17, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, gap: 4 },
  title: { color: colors.cream, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  organizer: { color: colors.goldSoft, fontSize: 12, fontWeight: '700' },
  scope: { color: colors.background, backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  data: { gap: 6, padding: 13, borderRadius: 15, backgroundColor: colors.surfaceRaised },
  dataText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  bold: { color: colors.text, fontWeight: '800' },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featuredCopy: { flex: 1, gap: 3 },
  featuredTitle: { color: colors.cream, fontSize: 13, fontWeight: '800' },
  featuredText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  actions: { gap: 10 },
  action: { width: '100%' },
});
