import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerVotingScreen() {
  const { polls, createPoll, votePoll } = useApp();
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  const create = () => {
    if (!question.trim() || !optionA.trim() || !optionB.trim()) {
      Alert.alert('Preencha a votação', 'Informe a pergunta e pelo menos duas opções.');
      return;
    }
    createPoll(question.trim(), [optionA.trim(), optionB.trim()]);
    setQuestion(''); setOptionA(''); setOptionB('');
    Alert.alert('Votação publicada', 'Esta é uma votação simples, sem validade formal ou ritualística.');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>VOTAÇÕES SIMPLES</Text><Text style={styles.title}>Consultar os irmãos</Text><Text style={styles.subtitle}>Use para escolhas operacionais e enquetes da Loja. Votações formais permanecem fora deste módulo.</Text></View>
      <View style={styles.notice}><Feather name="info" size={18} color={colors.gold} /><Text style={styles.noticeText}>Sem anonimato criptográfico ou rito formal nesta fase. O objetivo é agilidade para decisões cotidianas.</Text></View>
      <View style={styles.formCard}>
        <TextInput value={question} onChangeText={setQuestion} placeholder="Pergunta" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={optionA} onChangeText={setOptionA} placeholder="Opção 1" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={optionB} onChangeText={setOptionB} placeholder="Opção 2" placeholderTextColor={colors.textMuted} style={styles.input} />
        <Button label="Publicar votação" onPress={create} />
      </View>
      <View style={styles.section}><Text style={styles.sectionTitle}>Votações ativas</Text>{polls.filter((poll) => poll.active).map((poll) => <View key={poll.id} style={styles.pollCard}><Text style={styles.question}>{poll.question}</Text><Text style={styles.total}>{poll.totalVotes} votos registrados</Text><View style={styles.options}>{poll.options.map((option) => { const percent = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0; return <Pressable key={option.id} onPress={() => votePoll(poll.id, option.id)} style={styles.option}><View style={styles.optionTop}><Text style={styles.optionLabel}>{option.label}</Text><Text style={styles.optionValue}>{option.votes} · {percent}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View></Pressable>; })}</View><Text style={styles.voteHint}>Toque em uma opção para simular um voto neste protótipo.</Text></View>)}</View>
      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 25, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 }, notice: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, noticeText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 13 },
  section: { gap: 10 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, pollCard: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, question: { color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 21 }, total: { color: colors.textMuted, fontSize: 10 }, options: { gap: 10 }, option: { gap: 6, padding: 11, borderRadius: 13, backgroundColor: colors.surfaceRaised }, optionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, optionLabel: { color: colors.text, fontSize: 12, fontWeight: '700', flex: 1 }, optionValue: { color: colors.goldSoft, fontSize: 10, fontWeight: '800' }, track: { height: 5, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 999, backgroundColor: colors.gold }, voteHint: { color: colors.textMuted, fontSize: 9, textAlign: 'center' },
});
