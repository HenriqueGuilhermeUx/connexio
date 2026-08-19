import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { loadHealthSnapshot } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Snapshot = { attendance_rate: number; overdue_rate: number; projects_done_rate: number; member_count: number };

export default function ManagerHealthScreen() {
  const { lodge, lodgeMembers, charges, financialEntries } = useApp();
  const fallback = useMemo<Snapshot>(() => {
    const overdue = charges.filter((charge) => charge.status !== 'PAID' && new Date(`${charge.dueDate}T12:00:00`) < new Date()).length;
    return { attendance_rate: 0, overdue_rate: charges.length ? (overdue / charges.length) * 100 : 0, projects_done_rate: 0, member_count: lodgeMembers.length };
  }, [charges, lodgeMembers.length]);
  const [snapshot, setSnapshot] = useState<Snapshot>(fallback);

  useEffect(() => {
    setSnapshot(fallback);
    if (!lodge) return;
    loadHealthSnapshot(lodge.id).then((data) => data && setSnapshot(data)).catch(() => undefined);
  }, [lodge?.id, fallback]);

  const openPayables = financialEntries.filter((entry) => entry.type === 'PAYABLE' && entry.status !== 'PAID').reduce((sum, entry) => sum + entry.amount, 0);
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO</Text><Text style={styles.title}>Semáforo da Loja</Text><Text style={styles.subtitle}>Em poucos segundos, o Venerável identifica o que está saudável e o que exige ação.</Text></View>
      <View style={styles.grid}>
        <Health label="Frequência" value={snapshot.attendance_rate ? `${snapshot.attendance_rate.toFixed(1)}%` : 'Sem dados'} state={snapshot.attendance_rate >= 70 ? 'GREEN' : snapshot.attendance_rate >= 55 ? 'YELLOW' : 'RED'} hint="Meta sugerida: acima de 70%" />
        <Health label="Inadimplência" value={`${snapshot.overdue_rate.toFixed(1)}%`} state={snapshot.overdue_rate < 10 ? 'GREEN' : snapshot.overdue_rate < 20 ? 'YELLOW' : 'RED'} hint="Meta sugerida: abaixo de 10%" />
        <Health label="Projetos" value={snapshot.projects_done_rate ? `${snapshot.projects_done_rate.toFixed(1)}% concluídos` : 'Sem dados'} state={snapshot.projects_done_rate >= 60 ? 'GREEN' : snapshot.projects_done_rate > 0 ? 'YELLOW' : 'RED'} hint="Acompanhe o plano anual" />
        <Health label="Membros ativos" value={String(snapshot.member_count)} state={snapshot.member_count > 0 ? 'GREEN' : 'RED'} hint="Base atual da Loja" />
      </View>
      <View style={styles.financeCard}><Feather name="alert-circle" size={20} color={colors.gold} /><View style={styles.financeCopy}><Text style={styles.financeTitle}>Compromissos financeiros em aberto</Text><Text style={styles.financeValue}>{openPayables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text><Text style={styles.financeText}>O Semáforo combina indicadores operacionais e financeiros; educação, liderança e acompanhamento de irmãos entram à medida que os módulos correspondentes forem utilizados.</Text></View></View>
    </Screen>
  );
}

function Health({ label, value, state, hint }: { label: string; value: string; state: 'GREEN' | 'YELLOW' | 'RED'; hint: string }) {
  const symbol = state === 'GREEN' ? '🟢' : state === 'YELLOW' ? '🟡' : '🔴';
  return <View style={styles.card}><Text style={styles.symbol}>{symbol}</Text><Text style={styles.cardLabel}>{label}</Text><Text style={styles.cardValue}>{value}</Text><Text style={styles.cardHint}>{hint}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 28, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48%', minWidth: 220, minHeight: 145, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 5 }, symbol: { fontSize: 19 }, cardLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, cardValue: { color: colors.cream, fontSize: 20, fontWeight: '900' }, cardHint: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 'auto' },
  financeCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gold }, financeCopy: { flex: 1, gap: 4 }, financeTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, financeValue: { color: colors.goldSoft, fontSize: 18, fontWeight: '900' }, financeText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
