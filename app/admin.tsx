import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { LodgeRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const memberSeed = [
  { id: '1', name: 'Marcos Oliveira', email: 'marcos@email.com', cim: '•••• 1274', lodge: 'ARLS Harmonia nº 88', city: 'São Paulo' },
  { id: '2', name: 'Eduardo Santos', email: 'eduardo@email.com', cim: '•••• 9031', lodge: 'ARLS Estrela do Mar nº 204', city: 'Guarujá' },
];

export default function AdminScreen() {
  const [memberRequests, setMemberRequests] = useState(memberSeed);
  const { managementRequests, decideManagementRequest } = useApp();
  const pendingManagement = managementRequests.filter((item) => item.status === 'PENDING');
  const totalPending = memberRequests.length + pendingManagement.length;

  const decideMember = (id: string, approved: boolean) => {
    const request = memberRequests.find((item) => item.id === id);
    setMemberRequests((current) => current.filter((item) => item.id !== id));
    Alert.alert(approved ? 'Membro aprovado' : 'Solicitação rejeitada', request?.name ?? 'Cadastro atualizado');
  };

  const decideManager = (id: string, approved: boolean) => {
    const request = managementRequests.find((item) => item.id === id);
    decideManagementRequest(id, approved);
    Alert.alert(
      approved ? 'Gestor aprovado' : 'Acesso rejeitado',
      approved ? `${request?.requesterName ?? 'Gestor'} foi autorizado a administrar ${request?.lodgeName ?? 'a Loja'}.` : 'A solicitação foi encerrada sem liberar acesso de gestão.',
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.summary}>
        <View style={styles.summaryIcon}><Feather name="shield" size={25} color={colors.gold} /></View>
        <View style={styles.summaryCopy}><Text style={styles.summaryValue}>{totalPending}</Text><Text style={styles.summaryLabel}>solicitações aguardando sua análise</Text></View>
      </View>

      <View style={styles.ownerCard}>
        <Feather name="lock" size={18} color={colors.gold} />
        <View style={styles.ownerCopy}>
          <Text style={styles.ownerTitle}>Admin Connexio</Text>
          <Text style={styles.ownerText}>Nesta fase, a aprovação administrativa permanece centralizada em você. O backend deverá registrar decisão, horário e evidência consultada.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gestores de Loja</Text>
          <Text style={styles.sectionCount}>{pendingManagement.length}</Text>
        </View>
        {pendingManagement.map((request) => (
          <View key={request.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{request.requesterName[0]}</Text></View>
              <View style={styles.cardCopy}>
                <Text style={styles.name}>{request.requesterName}</Text>
                <Text style={styles.email}>{request.requesterEmail}</Text>
              </View>
              <View style={styles.managerBadge}><Text style={styles.managerBadgeText}>GESTOR</Text></View>
            </View>
            <View style={styles.dataBox}>
              <Data label="Loja" value={`${request.lodgeName}${request.lodgeNumber ? ` nº ${request.lodgeNumber}` : ''}`} />
              <Data label="Oriente" value={request.orient} />
              <Data label="Cargo" value={roleLabel(request.requestedRole)} />
              <Data label="Documento" value={request.evidenceName} />
              {request.notes ? <Data label="Observações" value={request.notes} /> : null}
            </View>
            <View style={styles.evidenceNotice}>
              <Feather name="file-text" size={16} color={colors.gold} />
              <Text style={styles.evidenceText}>No backend, toque aqui abrirá a comprovação armazenada com acesso restrito.</Text>
            </View>
            <View style={styles.actions}>
              <Button label="Rejeitar" variant="danger" style={styles.action} onPress={() => decideManager(request.id, false)} />
              <Button label="Aprovar gestor" style={styles.action} onPress={() => decideManager(request.id, true)} />
            </View>
          </View>
        ))}
        {!pendingManagement.length ? <Empty text="Nenhuma solicitação de gestor pendente." /> : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Novos membros</Text>
          <Text style={styles.sectionCount}>{memberRequests.length}</Text>
        </View>
        {memberRequests.map((request) => (
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
              <Button label="Rejeitar" variant="danger" style={styles.action} onPress={() => decideMember(request.id, false)} />
              <Button label="Aprovar" style={styles.action} onPress={() => decideMember(request.id, true)} />
            </View>
          </View>
        ))}
        {!memberRequests.length ? <Empty text="Nenhuma solicitação de membro pendente." /> : null}
      </View>
    </Screen>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return <View style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>;
}

function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Feather name="check-circle" size={26} color={colors.success} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function roleLabel(role: LodgeRole) {
  if (role === 'WORSHIPFUL_MASTER') return 'Venerável Mestre';
  if (role === 'SECRETARY') return 'Secretário';
  if (role === 'TREASURER') return 'Tesoureiro';
  return 'Membro';
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  summaryIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flexDirection: 'row', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', flex: 1 },
  summaryValue: { color: colors.cream, fontSize: 25, fontWeight: '900' },
  summaryLabel: { color: colors.textMuted, fontSize: 13, flex: 1 },
  ownerCard: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 15, backgroundColor: 'rgba(241,200,107,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,107,0.30)' },
  ownerCopy: { flex: 1, gap: 3 },
  ownerTitle: { color: colors.warning, fontSize: 12, fontWeight: '800' },
  ownerText: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionCount: { minWidth: 28, textAlign: 'center', color: colors.goldSoft, fontSize: 11, fontWeight: '900', backgroundColor: colors.surfaceRaised, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  card: { gap: 15, padding: 16, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cream, fontWeight: '900', fontSize: 18 },
  cardCopy: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  email: { color: colors.textMuted, fontSize: 12 },
  managerBadge: { borderRadius: 999, borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 8, paddingVertical: 5 },
  managerBadgeText: { color: colors.goldSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  dataBox: { gap: 10, padding: 13, borderRadius: 14, backgroundColor: colors.surfaceRaised },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  dataLabel: { color: colors.textMuted, fontSize: 11 },
  dataValue: { color: colors.cream, fontSize: 11, fontWeight: '600', textAlign: 'right', flex: 1 },
  evidenceNotice: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  evidenceText: { flex: 1, color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 46 },
  empty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 12 },
});
