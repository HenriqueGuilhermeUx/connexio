import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { checkInCredential, createSession, loadSessions } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

type Session = { id: string; title: string; starts_at: string; objective?: string | null; status: string; lodge_attendance?: Array<{ member_id: string; checked_in_at: string; method: string }> };

export default function ManagerSessionsScreen() {
  const { lodge } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState('Sessão ordinária');
  const [startsAt, setStartsAt] = useState('');
  const [objective, setObjective] = useState('');
  const [credential, setCredential] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const reload = () => { if (lodge) loadSessions(lodge.id).then((rows) => rows && setSessions(rows as Session[])).catch(() => undefined); };
  useEffect(reload, [lodge?.id]);

  const add = async () => {
    if (!lodge || !title.trim() || !startsAt.trim()) { Alert.alert('Informe título e data/hora'); return; }
    try { const row = await createSession(lodge.id, title.trim(), startsAt.trim(), objective.trim() || undefined); if (row) setSessions((current) => [row as Session, ...current]); setObjective(''); } catch { Alert.alert('Não foi possível criar a sessão'); }
  };

  const checkIn = async () => {
    if (!selectedSession || !credential.trim()) { Alert.alert('Selecione a sessão e informe o token do QR'); return; }
    const token = credential.includes('token=') ? credential.split('token=')[1].split('&')[0] : credential.trim();
    try { await checkInCredential(selectedSession, token); setCredential(''); reload(); Alert.alert('Presença registrada', 'Check-in realizado com a carteirinha Connexio.'); } catch (error: any) { Alert.alert('Credencial não validada', error?.message ?? 'Confira a credencial e a sessão.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR FREE</Text><Text style={styles.title}>Sessões & Frequência</Text><Text style={styles.subtitle}>Crie a sessão, registre presença e alimente automaticamente os indicadores da Loja.</Text></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Nova sessão</Text><TextInput value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.textMuted} style={styles.input} /><TextInput value={startsAt} onChangeText={setStartsAt} placeholder="AAAA-MM-DDTHH:MM:SS" placeholderTextColor={colors.textMuted} style={styles.input} /><TextInput value={objective} onChangeText={setObjective} placeholder="Objetivo da sessão: o que os irmãos levarão para casa?" placeholderTextColor={colors.textMuted} style={styles.input} /><Button label="Criar sessão" onPress={add} /></View>
    <View style={styles.card}><View style={styles.scanHeader}><Feather name="camera" size={20} color={colors.gold} /><View style={styles.flex}><Text style={styles.cardTitle}>Check-in por carteirinha</Text><Text style={styles.hint}>No mobile, o próximo passo é abrir a câmera; nesta fundação já aceitamos o token/URL lido do QR.</Text></View></View><View style={styles.chips}>{sessions.slice(0, 5).map((session) => <Text key={session.id} onPress={() => setSelectedSession(session.id)} style={[styles.chip, selectedSession === session.id && styles.chipActive]}>{session.title}</Text>)}</View><TextInput value={credential} onChangeText={setCredential} placeholder="Cole o token ou URL do QR" placeholderTextColor={colors.textMuted} autoCapitalize="none" style={styles.input} /><Button label="Registrar presença" onPress={checkIn} /></View>
    <View style={styles.list}><Text style={styles.sectionTitle}>Sessões</Text>{sessions.map((session) => <View key={session.id} style={styles.session}><View style={styles.sessionIcon}><Feather name="calendar" size={18} color={colors.gold} /></View><View style={styles.flex}><Text style={styles.sessionTitle}>{session.title}</Text><Text style={styles.meta}>{new Date(session.starts_at).toLocaleString('pt-BR')} · {session.lodge_attendance?.length ?? 0} presenças</Text>{session.objective ? <Text style={styles.objective}>{session.objective}</Text> : null}</View></View>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({ content: { paddingTop: 22, gap: 18 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 28, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 }, card: { gap: 11, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 13 }, scanHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' }, flex: { flex: 1 }, hint: { color: colors.textMuted, fontSize: 9, lineHeight: 14 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { color: colors.textMuted, fontSize: 9, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border }, chipActive: { color: colors.goldSoft, borderColor: colors.gold }, list: { gap: 9 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, session: { flexDirection: 'row', gap: 11, padding: 13, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, sessionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, sessionTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, meta: { color: colors.textMuted, fontSize: 10 }, objective: { color: colors.goldSoft, fontSize: 9, marginTop: 4 } });
