import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { createObligation, completeObligation, loadObligations, LodgeObligation } from '@/lib/obligationsRepository';
import { colors } from '@/theme/colors';
import { LodgeRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const roles: Array<Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>> = ['SECRETARY', 'TREASURER', 'WORSHIPFUL_MASTER'];
const recurrences: LodgeObligation['recurrence'][] = ['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

export default function ManagerObligationsScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<LodgeObligation[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [responsibleRole, setResponsibleRole] = useState<(typeof roles)[number]>('SECRETARY');
  const [recurrence, setRecurrence] = useState<LodgeObligation['recurrence']>('NONE');
  const [reminderDays, setReminderDays] = useState('7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lodge) return;
    void loadObligations(lodge.id).then((remote) => {
      if (remote) setItems(remote);
    }).catch(() => undefined);
  }, [lodge]);

  const openItems = useMemo(() => items.filter((item) => item.status === 'OPEN'), [items]);

  const add = async () => {
    if (!lodge || !title.trim() || !dueDate.trim()) {
      Alert.alert('Dados obrigatórios', 'Informe título e data de vencimento.');
      return;
    }
    const days = Math.max(0, Number(reminderDays) || 0);
    setLoading(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate.trim(),
        responsibleRole,
        recurrence,
        reminderDays: days,
      };
      const remoteId = await createObligation(lodge.id, input);
      setItems((current) => [{ ...input, id: remoteId ?? `local-${Date.now()}`, lodgeId: lodge.id, status: 'OPEN' }, ...current]);
      setTitle(''); setDueDate(''); setDescription(''); setReminderDays('7'); setRecurrence('NONE');
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (item: LodgeObligation) => {
    try {
      if (!item.id.startsWith('local-')) await completeObligation(item.id);
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, status: 'DONE' } : row));
    } catch (error) {
      Alert.alert('Não foi possível concluir', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTOR PRO</Text>
        <Text style={styles.title}>Obrigações & vencimentos</Text>
        <Text style={styles.subtitle}>Centralize compromissos administrativos, renovações, documentos e datas críticas da Loja.</Text>
      </View>

      <View style={styles.summary}><Feather name="clock" size={20} color={colors.gold} /><Text style={styles.summaryValue}>{openItems.length}</Text><Text style={styles.summaryText}>obrigações em aberto</Text></View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Nova obrigação</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Renovar certificado digital" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Vencimento AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={description} onChangeText={setDescription} placeholder="Observações (opcional)" placeholderTextColor={colors.textMuted} style={[styles.input, styles.notes]} multiline />
        <Text style={styles.label}>Responsável</Text>
        <View style={styles.chips}>{roles.map((item) => <Chip key={item} label={roleLabel(item)} active={responsibleRole === item} onPress={() => setResponsibleRole(item)} />)}</View>
        <Text style={styles.label}>Recorrência</Text>
        <View style={styles.chips}>{recurrences.map((item) => <Chip key={item} label={recurrenceLabel(item)} active={recurrence === item} onPress={() => setRecurrence(item)} />)}</View>
        <TextInput value={reminderDays} onChangeText={setReminderDays} placeholder="Lembrar quantos dias antes?" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={styles.input} />
        <Button label="Salvar obrigação" loading={loading} onPress={() => void add()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos vencimentos</Text>
        {items.map((item) => (
          <View key={item.id} style={[styles.card, item.status === 'DONE' && styles.doneCard]}>
            <View style={styles.icon}><Feather name={item.status === 'DONE' ? 'check' : 'calendar'} size={18} color={colors.gold} /></View>
            <View style={styles.copy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.meta}>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString('pt-BR')} · {roleLabel(item.responsibleRole)}</Text>
              <Text style={styles.meta}>{recurrenceLabel(item.recurrence)} · alerta {item.reminderDays} dias antes</Text>
              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            </View>
            {item.status === 'OPEN' ? <Pressable onPress={() => void complete(item)}><Text style={styles.action}>Concluir</Text></Pressable> : <Text style={styles.done}>Concluída</Text>}
          </View>
        ))}
        {!items.length ? <Text style={styles.empty}>Nenhuma obrigação cadastrada ainda.</Text> : null}
      </View>

      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}
function roleLabel(role: LodgeRole) { return role === 'SECRETARY' ? 'Secretário' : role === 'TREASURER' ? 'Tesoureiro' : role === 'WORSHIPFUL_MASTER' ? 'Venerável' : 'Membro'; }
function recurrenceLabel(value: LodgeObligation['recurrence']) { return value === 'NONE' ? 'Única' : value === 'MONTHLY' ? 'Mensal' : value === 'QUARTERLY' ? 'Trimestral' : 'Anual'; }

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 26, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: 8, padding: 15, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, summaryValue: { color: colors.cream, fontSize: 24, fontWeight: '900' }, summaryText: { color: colors.textMuted, fontSize: 12 },
  formCard: { gap: 11, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gold }, formTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 13, fontSize: 12 }, notes: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }, label: { color: colors.textMuted, fontSize: 10, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border }, chipActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' }, chipText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' }, chipTextActive: { color: colors.goldSoft },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, doneCard: { opacity: 0.65 }, icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised }, copy: { flex: 1, gap: 2 }, itemTitle: { color: colors.text, fontSize: 12, fontWeight: '800' }, meta: { color: colors.textMuted, fontSize: 9 }, description: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 }, action: { color: colors.goldSoft, fontSize: 9, fontWeight: '900' }, done: { color: colors.success, fontSize: 9, fontWeight: '800' }, empty: { color: colors.textMuted, fontSize: 11, textAlign: 'center', paddingVertical: 20 },
});
