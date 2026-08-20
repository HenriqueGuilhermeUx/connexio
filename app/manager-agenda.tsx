import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerAgendaScreen() {
  const { lodgeEvents, createLodgeEvent, toggleEventAttendance, member } = useApp();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [registration, setRegistration] = useState(false);

  const create = () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Dados obrigatórios', 'Informe título e data no formato AAAA-MM-DD.');
      return;
    }
    const startsAt = new Date(`${date.trim()}T${time.trim() || '20:00'}:00`).toISOString();
    createLodgeEvent({ title: title.trim(), description: description.trim() || undefined, startsAt, location: location.trim() || undefined, requiresRegistration: registration });
    setTitle(''); setDate(''); setLocation(''); setDescription(''); setRegistration(false);
    Alert.alert('Evento criado', 'A data foi incluída na agenda da Loja.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>AGENDA</Text><Text style={styles.title}>Datas e eventos</Text><Text style={styles.subtitle}>Sessões, jantares, reuniões e compromissos num único calendário.</Text></View>
      <View style={styles.formCard}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Título do evento" placeholderTextColor={colors.textMuted} style={styles.input} />
        <View style={styles.row}><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /><TextInput value={time} onChangeText={setTime} placeholder="20:00" placeholderTextColor={colors.textMuted} style={[styles.input, styles.time]} /></View>
        <TextInput value={location} onChangeText={setLocation} placeholder="Local" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={description} onChangeText={setDescription} placeholder="Observações" placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.notes]} />
        <Pressable onPress={() => setRegistration((value) => !value)} style={[styles.registration, registration && styles.registrationActive]}><Feather name={registration ? 'check-square' : 'square'} size={17} color={registration ? colors.gold : colors.textMuted} /><Text style={styles.registrationText}>Exigir confirmação de presença</Text></Pressable>
        <Button label="Adicionar à agenda" onPress={create} />
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Próximos compromissos</Text>{lodgeEvents.map((event) => { const attending = !!member && event.attendeeIds.includes(member.id); return <View key={event.id} style={styles.eventCard}><View style={styles.dateBox}><Text style={styles.day}>{new Date(event.startsAt).toLocaleDateString('pt-BR', { day: '2-digit' })}</Text><Text style={styles.month}>{new Date(event.startsAt).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}</Text></View><View style={styles.eventCopy}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventMeta}>{new Date(event.startsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}{event.location ? ` · ${event.location}` : ''}</Text>{event.description ? <Text style={styles.eventText}>{event.description}</Text> : null}<Text style={styles.attendees}>{event.attendeeIds.length} confirmações</Text></View>{event.requiresRegistration ? <Pressable onPress={() => toggleEventAttendance(event.id)} style={[styles.attendButton, attending && styles.attendButtonActive]}><Feather name={attending ? 'check' : 'plus'} size={15} color={colors.gold} /></Pressable> : null}</View>; })}</View>
      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 25, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 13 }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 }, time: { width: 95 }, notes: { minHeight: 90, paddingTop: 13, textAlignVertical: 'top' }, registration: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, registrationActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.08)' }, registrationText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, eventCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, dateBox: { width: 54, height: 58, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, day: { color: colors.cream, fontSize: 20, fontWeight: '900' }, month: { color: colors.goldSoft, fontSize: 9, fontWeight: '900' }, eventCopy: { flex: 1, gap: 3 }, eventTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, eventMeta: { color: colors.textMuted, fontSize: 10 }, eventText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 }, attendees: { color: colors.goldSoft, fontSize: 9, fontWeight: '700' }, attendButton: { width: 36, height: 36, borderRadius: 11, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, attendButtonActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' },
});
