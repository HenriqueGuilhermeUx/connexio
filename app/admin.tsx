import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const seed = [
  { id: '1', name: 'Marcos Oliveira', email: 'marcos@email.com', cim: '•••• 1274', lodge: 'ARLS Harmonia nº 88', city: 'São Paulo' },
  { id: '2', name: 'Eduardo Santos', email: 'eduardo@email.com', cim: '•••• 9031', lodge: 'ARLS Estrela do Mar nº 204', city: 'Guarujá' },
];

export default function AdminScreen() {
  const [requests, setRequests] = useState(seed);

  const decide = (id: string, approved: boolean) => {
    const request = requests.find((item) => item.id === id);
    setRequests((current) => current.filter((item) => item.id !== id));
    Alert.alert(approved ? 'Membro aprovado' : 'Solicitação rejeitada', request?.name ?? 'Cadastro atualizado');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}><Feather name="shield" size={25} color={colors.gold} /></View>
        <View style={styles.summaryCopy}><Text style={styles.summaryValue}>{requests.length}</Text><Text style={styles.summaryLabel}>solicitações aguardando análise</Text></View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Protótipo operacional</Text>
        <Text style={styles.noticeText}>As decisões abaixo são locais e não persistem. O backend deverá registrar administrador, horário, evidência consultada e motivo da decisão.</Text>
      </View>

      <View style={styles.list}>
        {requests.map((request) => (
          <View key={request.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{request.name[0]}</Text></View>
              <View style={styles.cardCopy}><Text style={styles.name}>{request.name}</Text><Text style={styles.email}>{request.email}</Text></View>
            </View>
            <View style={styles.dataBox}>
              <Data label="CIM" value={request.cim} />
              <Data label="Loja" value={request.lodge} />
              <Data label="Cidade" value={request.city} />
            </View>
            <View style={styles.actions}>
              <Button label="Rejeitar" variant="danger" style={styles.action} onPress={() => decide(request.id, false)} />
              <Button label="Aprovar" style={styles.action} onPress={() => decide(request.id, true)} />
            </View>
          </View>
        ))}
        {!requests.length ? <View style={styles.empty}><Feather name="check-circle" size={34} color={colors.success} /><Text style={styles.emptyTitle}>Fila concluída</Text><Text style={styles.emptyText}>Não há solicitações pendentes neste protótipo.</Text></View> : null}
      </View>
    </Screen>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return <View style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  summaryIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flexDirection: 'row', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' },
  summaryValue: { color: colors.cream, fontSize: 25, fontWeight: '900' },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  notice: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(241,200,107,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,107,0.30)', gap: 4 },
  noticeTitle: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  noticeText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  list: { gap: 14 },
  card: { gap: 15, padding: 16, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cream, fontWeight: '900', fontSize: 18 },
  cardCopy: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  email: { color: colors.textMuted, fontSize: 12 },
  dataBox: { gap: 10, padding: 13, borderRadius: 14, backgroundColor: colors.surfaceRaised },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  dataLabel: { color: colors.textMuted, fontSize: 12 },
  dataValue: { color: colors.cream, fontSize: 12, fontWeight: '600', textAlign: 'right', flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 46 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
