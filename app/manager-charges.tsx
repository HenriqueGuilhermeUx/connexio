import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerChargesScreen() {
  const { lodgeMembers, charges, createCharge } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState(lodgeMembers[0]?.id ?? '');
  const [description, setDescription] = useState('Mensalidade');
  const [amount, setAmount] = useState('150');
  const [dueDate, setDueDate] = useState('');

  const selectedMember = lodgeMembers.find((item) => item.id === selectedMemberId);

  const originate = () => {
    const numericAmount = Number(amount.replace(',', '.'));
    if (!selectedMember || !description.trim() || !dueDate.trim() || !numericAmount) {
      Alert.alert('Dados obrigatórios', 'Selecione o membro e informe descrição, valor e vencimento.');
      return;
    }
    createCharge({ memberId: selectedMember.id, memberName: selectedMember.name, description: description.trim(), amount: numericAmount, dueDate: dueDate.trim() });
    Alert.alert('Cobrança criada', 'A cobrança ficou como rascunho. Quando o provedor Pix for integrado, daqui sairá a cobrança real com QR Code e conciliação.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO</Text><Text style={styles.title}>Cobranças</Text><Text style={styles.subtitle}>Origine mensalidades e outras cobranças por membro sem depender de planilhas paralelas.</Text></View>
      <View style={styles.providerNotice}><Feather name="zap" size={19} color={colors.gold} /><View style={styles.providerCopy}><Text style={styles.providerTitle}>Motor de cobrança preparado</Text><Text style={styles.providerText}>Nesta etapa criamos a ordem de cobrança. O adaptador Pix será conectado depois para gerar QR Code, copiar e colar, webhook de pagamento e baixa automática.</Text></View></View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Membro</Text>
        <View style={styles.memberList}>{lodgeMembers.map((item) => <Pressable key={item.id} onPress={() => setSelectedMemberId(item.id)} style={[styles.memberChip, selectedMemberId === item.id && styles.memberChipActive]}><Text style={[styles.memberChipText, selectedMemberId === item.id && styles.memberChipTextActive]}>{item.name}</Text></Pressable>)}</View>
        <TextInput value={description} onChangeText={setDescription} placeholder="Descrição" placeholderTextColor={colors.textMuted} style={styles.input} />
        <View style={styles.row}><TextInput value={amount} onChangeText={setAmount} placeholder="Valor" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /><TextInput value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /></View>
        <Button label="Criar cobrança" onPress={originate} />
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Cobranças recentes</Text>{charges.map((charge) => <View key={charge.id} style={styles.chargeCard}><View style={styles.chargeIcon}><Feather name="credit-card" size={18} color={colors.gold} /></View><View style={styles.chargeCopy}><Text style={styles.chargeName}>{charge.memberName}</Text><Text style={styles.chargeMeta}>{charge.description} · vence {new Date(`${charge.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</Text></View><View style={styles.chargeRight}><Text style={styles.chargeValue}>{charge.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text><Text style={styles.chargeStatus}>{statusLabel(charge.status)}</Text></View></View>)}</View>

      <View style={styles.bulkCard}><Feather name="users" size={20} color={colors.gold} /><View style={styles.bulkCopy}><Text style={styles.bulkTitle}>Cobrança em lote</Text><Text style={styles.bulkText}>Próxima evolução: gerar a mensalidade de todos os membros ativos em um único comando, inclusive por voz.</Text></View></View>
      <Button label="Voltar à Tesouraria" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function statusLabel(status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED') { if (status === 'DRAFT') return 'Rascunho'; if (status === 'PENDING') return 'Pendente'; if (status === 'PAID') return 'Pago'; return 'Cancelado'; }

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  providerNotice: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 15, backgroundColor: 'rgba(209,174,87,0.08)', borderWidth: 1, borderColor: colors.gold }, providerCopy: { flex: 1, gap: 3 }, providerTitle: { color: colors.goldSoft, fontSize: 12, fontWeight: '900' }, providerText: { color: colors.textMuted, fontSize: 10, lineHeight: 16 },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, label: { color: colors.text, fontSize: 12, fontWeight: '800' }, memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, memberChip: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }, memberChipActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' }, memberChipText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' }, memberChipTextActive: { color: colors.goldSoft }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 13 }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, chargeCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, chargeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, chargeCopy: { flex: 1, gap: 2 }, chargeName: { color: colors.text, fontSize: 13, fontWeight: '800' }, chargeMeta: { color: colors.textMuted, fontSize: 10 }, chargeRight: { alignItems: 'flex-end', gap: 2 }, chargeValue: { color: colors.cream, fontSize: 12, fontWeight: '900' }, chargeStatus: { color: colors.goldSoft, fontSize: 9, fontWeight: '800' },
  bulkCard: { flexDirection: 'row', gap: 11, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, bulkCopy: { flex: 1, gap: 3 }, bulkTitle: { color: colors.text, fontSize: 12, fontWeight: '900' }, bulkText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
