import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerCommunicationsScreen() {
  const { announcements, createAnnouncement } = useApp();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [important, setImportant] = useState(false);
  const [push, setPush] = useState(true);

  const publish = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Preencha o comunicado', 'Informe título e mensagem.');
      return;
    }
    createAnnouncement({ title: title.trim(), message: message.trim(), priority: important ? 'IMPORTANT' : 'NORMAL', pushRequested: push });
    setTitle(''); setMessage(''); setImportant(false);
    Alert.alert('Comunicado publicado', push ? 'O push foi marcado para envio quando o backend de notificações estiver conectado.' : 'O comunicado já aparece no mural da Loja.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>COMUNICAÇÃO</Text><Text style={styles.title}>Comunicados da Loja</Text><Text style={styles.subtitle}>Centralize avisos importantes e reduza mensagens perdidas em grupos.</Text></View>
      <View style={styles.formCard}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Título do comunicado" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={message} onChangeText={setMessage} placeholder="Escreva o aviso aos irmãos" placeholderTextColor={colors.textMuted} multiline style={[styles.input, styles.message]} />
        <View style={styles.options}>
          <Toggle label="Marcar como importante" active={important} onPress={() => setImportant((value) => !value)} />
          <Toggle label="Enviar push" active={push} onPress={() => setPush((value) => !value)} />
        </View>
        <Button label="Publicar comunicado" onPress={publish} />
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Mural</Text>{announcements.map((item) => <View key={item.id} style={styles.card}><View style={styles.cardTop}><View style={[styles.icon, item.priority === 'IMPORTANT' && styles.iconImportant]}><Feather name={item.priority === 'IMPORTANT' ? 'alert-circle' : 'bell'} size={18} color={colors.gold} /></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text></View>{item.pushRequested ? <View style={styles.pushBadge}><Text style={styles.pushText}>PUSH</Text></View> : null}</View><Text style={styles.cardText}>{item.message}</Text></View>)}</View>
      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleActive]}><Feather name={active ? 'check-square' : 'square'} size={17} color={active ? colors.gold : colors.textMuted} /><Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 25, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 13 }, message: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, toggle: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, toggleActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.08)' }, toggleText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' }, toggleTextActive: { color: colors.goldSoft },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, card: { gap: 11, padding: 15, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, iconImportant: { borderWidth: 1, borderColor: colors.gold }, cardCopy: { flex: 1, gap: 2 }, cardTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, date: { color: colors.textMuted, fontSize: 10 }, cardText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 }, pushBadge: { borderRadius: 999, borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 7, paddingVertical: 4 }, pushText: { color: colors.goldSoft, fontSize: 8, fontWeight: '900' },
});
