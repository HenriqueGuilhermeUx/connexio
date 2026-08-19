import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { FinancialEntryType } from '@/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerFinanceScreen() {
  const { financialEntries, createFinancialEntry, markFinancialEntryPaid } = useApp();
  const [type, setType] = useState<FinancialEntryType>('PAYABLE');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  const totals = useMemo(() => {
    const open = financialEntries.filter((entry) => entry.status !== 'PAID');
    return {
      payable: open.filter((entry) => entry.type === 'PAYABLE').reduce((sum, entry) => sum + entry.amount, 0),
      receivable: open.filter((entry) => entry.type === 'RECEIVABLE').reduce((sum, entry) => sum + entry.amount, 0),
    };
  }, [financialEntries]);

  const add = () => {
    const numericAmount = Number(amount.replace(',', '.'));
    if (!description.trim() || !category.trim() || !dueDate.trim() || !numericAmount) {
      Alert.alert('Preencha o lançamento', 'Descrição, categoria, valor e vencimento são obrigatórios.');
      return;
    }
    createFinancialEntry({ type, description: description.trim(), category: category.trim(), amount: numericAmount, dueDate: dueDate.trim(), recurring, attachmentName: attachmentName || undefined });
    setDescription(''); setCategory(''); setAmount(''); setDueDate(''); setRecurring(false); setAttachmentName('');
    Alert.alert('Lançamento criado', type === 'PAYABLE' ? 'Conta a pagar registrada.' : 'Conta a receber registrada.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO</Text><Text style={styles.title}>Tesouraria</Text><Text style={styles.subtitle}>Contas, vencimentos, obrigações e comprovantes organizados para o Tesoureiro.</Text></View>

      <View style={styles.summaryRow}>
        <Summary label="A pagar" value={totals.payable} icon="arrow-up-circle" />
        <Summary label="A receber" value={totals.receivable} icon="arrow-down-circle" />
      </View>

      <View style={styles.formCard}>
        <View style={styles.typeRow}>
          <TypeButton label="Conta a pagar" active={type === 'PAYABLE'} onPress={() => setType('PAYABLE')} />
          <TypeButton label="Conta a receber" active={type === 'RECEIVABLE'} onPress={() => setType('RECEIVABLE')} />
        </View>
        <TextInput value={description} onChangeText={setDescription} placeholder="Descrição" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={category} onChangeText={setCategory} placeholder="Categoria" placeholderTextColor={colors.textMuted} style={styles.input} />
        <View style={styles.formRow}>
          <TextInput value={amount} onChangeText={setAmount} placeholder="Valor" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[styles.input, styles.flex]} />
          <TextInput value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} />
        </View>
        <Pressable onPress={() => setRecurring((value) => !value)} style={[styles.option, recurring && styles.optionActive]}><Feather name={recurring ? 'check-square' : 'square'} size={17} color={recurring ? colors.gold : colors.textMuted} /><Text style={styles.optionText}>Obrigação recorrente</Text></Pressable>
        <Pressable onPress={() => setAttachmentName('comprovante-ou-documento.pdf')} style={styles.attachment}><Feather name="paperclip" size={18} color={colors.gold} /><View style={styles.attachmentCopy}><Text style={styles.attachmentTitle}>{attachmentName || 'Anexar boleto, nota ou comprovante'}</Text><Text style={styles.attachmentHint}>O arquivo será guardado no storage quando a persistência real estiver conectada.</Text></View></Pressable>
        <Button label="Salvar lançamento" onPress={add} />
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Lançamentos</Text>{financialEntries.map((entry) => <View key={entry.id} style={styles.entryCard}><View style={styles.entryIcon}><Feather name={entry.type === 'PAYABLE' ? 'arrow-up-right' : 'arrow-down-left'} size={18} color={colors.gold} /></View><View style={styles.entryCopy}><Text style={styles.entryTitle}>{entry.description}</Text><Text style={styles.entryMeta}>{entry.category} · vence {new Date(`${entry.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</Text>{entry.recurring ? <Text style={styles.recurring}>RECORRENTE</Text> : null}</View><View style={styles.entryRight}><Text style={styles.entryValue}>{formatMoney(entry.amount)}</Text><Text style={[styles.entryStatus, entry.status === 'PAID' && styles.paid]}>{entry.status === 'PAID' ? 'Pago' : 'Em aberto'}</Text>{entry.status !== 'PAID' ? <Pressable onPress={() => markFinancialEntryPaid(entry.id)}><Text style={styles.payAction}>Dar baixa</Text></Pressable> : null}</View></View>)}</View>

      <Button label="Cobranças e mensalidades" onPress={() => router.push('/manager-charges')} />
      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Summary({ label, value, icon }: { label: string; value: number; icon: keyof typeof Feather.glyphMap }) { return <View style={styles.summaryCard}><Feather name={icon} size={20} color={colors.gold} /><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{formatMoney(value)}</Text></View>; }
function TypeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.typeButton, active && styles.typeButtonActive]}><Text style={[styles.typeText, active && styles.typeTextActive]}>{label}</Text></Pressable>; }
function formatMoney(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  summaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, summaryCard: { flex: 1, minWidth: 220, gap: 5, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, summaryLabel: { color: colors.textMuted, fontSize: 11 }, summaryValue: { color: colors.cream, fontSize: 20, fontWeight: '900' },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gold }, typeRow: { flexDirection: 'row', gap: 8 }, typeButton: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }, typeButtonActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' }, typeText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' }, typeTextActive: { color: colors.goldSoft }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 13 }, formRow: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 }, option: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, optionActive: { borderColor: colors.gold }, optionText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, attachment: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold }, attachmentCopy: { flex: 1, gap: 2 }, attachmentTitle: { color: colors.text, fontSize: 11, fontWeight: '700' }, attachmentHint: { color: colors.textMuted, fontSize: 9, lineHeight: 14 },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, entryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, entryIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, entryCopy: { flex: 1, gap: 2 }, entryTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, entryMeta: { color: colors.textMuted, fontSize: 10 }, recurring: { color: colors.goldSoft, fontSize: 8, fontWeight: '900' }, entryRight: { alignItems: 'flex-end', gap: 2 }, entryValue: { color: colors.cream, fontSize: 12, fontWeight: '900' }, entryStatus: { color: colors.warning, fontSize: 9, fontWeight: '700' }, paid: { color: colors.success }, payAction: { color: colors.goldSoft, fontSize: 9, fontWeight: '800', marginTop: 4 },
});
