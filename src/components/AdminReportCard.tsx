import { AdminDecisionCard } from '@/components/AdminDecisionCard';
import { AdminDataBox } from '@/components/AdminDataBox';
import { AdminReasonField } from '@/components/AdminReasonField';
import { Button } from '@/components/Button';
import { DataRow } from '@/components/DataRow';
import { AdminReportQueueRecord, DbReportStatus } from '@/types/database';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const reasonLabels = {
  INAPPROPRIATE: 'Conteúdo inadequado',
  MISLEADING: 'Informação enganosa',
  FRAUD: 'Suspeita de fraude',
  DUPLICATE: 'Oferta duplicada',
  OTHER: 'Outro motivo',
} as const;

export function AdminReportCard({
  report,
  busy,
  onDecision,
}: {
  report: AdminReportQueueRecord;
  busy?: DbReportStatus;
  onDecision: (decision: 'RESOLVED' | 'DISMISSED', note: string) => void;
}) {
  const [note, setNote] = useState('');
  return (
    <AdminDecisionCard title={report.listing_title} subtitle={`Denunciada por ${report.reporter_name} · ${report.reporter_email}`}>
      <AdminDataBox>
        <DataRow label="Motivo" value={reasonLabels[report.reason]} />
        <DataRow label="Ofertante" value={report.owner_name} />
        <DataRow label="Detalhes" value={report.details || 'Sem detalhes adicionais'} />
        <DataRow label="Recebida em" value={new Date(report.created_at).toLocaleString('pt-BR')} />
      </AdminDataBox>
      <AdminReasonField value={note} onChangeText={setNote} />
      <View style={styles.actions}>
        <Button label="Arquivar" variant="secondary" onPress={() => onDecision('DISMISSED', note)} loading={busy === 'DISMISSED'} style={styles.action} />
        <Button label="Resolver" onPress={() => onDecision('RESOLVED', note)} loading={busy === 'RESOLVED'} style={styles.action} />
      </View>
    </AdminDecisionCard>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
