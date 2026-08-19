import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { saveMinutes } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerMinutesScreen() {
  const { lodge } = useApp();
  const [meetingDate, setMeetingDate] = useState('');
  const [sessionLabel, setSessionLabel] = useState('Sessão ordinária');
  const [matters, setMatters] = useState('');
  const [decisions, setDecisions] = useState('');
  const [pendingItems, setPendingItems] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const save = async () => {
    if (!lodge || !meetingDate.trim() || !sessionLabel.trim()) { Alert.alert('Informe data e sessão'); return; }
    try {
      await saveMinutes(lodge.id, { meetingDate: meetingDate.trim(), sessionLabel: sessionLabel.trim(), matters: matters.trim(), decisions: decisions.trim(), pendingItems: pendingItems.trim(), closingNotes: closingNotes.trim() });
      Alert.alert('Ata salva', 'O registro estruturado foi arquivado como rascunho.');
    } catch { Alert.alert('Ata mantida no formulário', 'Não foi possível sincronizar agora.'); }
  };

  const generated = [
    `Data: ${meetingDate || '—'}`,
    `Sessão: ${sessionLabel || '—'}`,
    `Assuntos tratados: ${matters || '—'}`,
    `Deliberações: ${decisions || '—'}`,
    `Pendências: ${pendingItems || '—'}`,
    `Encerramento: ${closingNotes || '—'}`,
  ].join('\n\n');

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · SECRETARIA</Text><Text style={styles.title}>Atas Inteligentes</Text><Text style={styles.subtitle}>A ata registra fatos, decisões e pendências. O Connexio organiza a estrutura para o Secretário não começar do zero.</Text></View>
    <View style={styles.card}><View style={styles.row}><TextInput value={meetingDate} onChangeText={setMeetingDate} placeholder="Data AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /><TextInput value={sessionLabel} onChangeText={setSessionLabel} placeholder="Tipo de sessão" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /></View><Area label="Assuntos tratados" value={matters} onChangeText={setMatters} /><Area label="Deliberações" value={decisions} onChangeText={setDecisions} /><Area label="Pendências e responsáveis" value={pendingItems} onChangeText={setPendingItems} /><Area label="Encerramento" value={closingNotes} onChangeText={setClosingNotes} /><Button label="Salvar rascunho da ata" onPress={save} /></View>
    <View style={styles.preview}><Text style={styles.previewTitle}>Prévia estruturada</Text><Text style={styles.previewText}>{generated}</Text></View>
  </Screen>;
}

function Area({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline placeholder={label} placeholderTextColor={colors.textMuted} style={[styles.input, styles.area]} /></View>; }
const styles = StyleSheet.create({ content: { paddingTop: 22, gap: 18 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 28, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 }, card: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', gap: 8 }, flex: { flex: 1 }, field: { gap: 6 }, label: { color: colors.text, fontSize: 11, fontWeight: '800' }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 13 }, area: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }, preview: { padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gold, gap: 9 }, previewTitle: { color: colors.goldSoft, fontSize: 13, fontWeight: '900' }, previewText: { color: colors.textMuted, fontSize: 11, lineHeight: 18 } });
