import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { reportListing } from '@/lib/compliance';
import { friendlyError } from '@/lib/errors';
import { colors } from '@/theme/colors';
import { ReportReason } from '@/types/database';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const reasons: [ReportReason, string][] = [
  ['INAPPROPRIATE', 'Conteúdo inadequado'],
  ['MISLEADING', 'Informação enganosa'],
  ['FRAUD', 'Suspeita de fraude'],
  ['DUPLICATE', 'Oferta duplicada'],
  ['OTHER', 'Outro motivo'],
];

export default function ReportListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = useState<ReportReason>('MISLEADING');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await reportListing(id, reason, details);
      Alert.alert('Denúncia recebida', 'A administração analisará o conteúdo e tomará as medidas necessárias.', [
        { text: 'Concluir', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível enviar', friendlyError(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="SEGURANÇA DA REDE"
        title="Denunciar oferta"
        subtitle="Use este canal para conteúdo inadequado, enganoso ou que possa colocar membros em risco."
      />
      <View style={styles.reasons}>
        {reasons.map(([value, label]) => {
          const selected = reason === value;
          return (
            <Pressable key={value} onPress={() => setReason(value)} style={[styles.reason, selected && styles.selected]}>
              <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.dot} /> : null}</View>
              <Text style={[styles.reasonText, selected && styles.selectedText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <FormField
        label="Detalhes (opcional)"
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={1000}
        placeholder="Descreva objetivamente o que precisa ser analisado."
      />
      <Button label="Enviar denúncia" variant="danger" onPress={() => void send()} loading={sending} />
      <Text style={styles.note}>Denúncias de boa-fé são confidenciais para os demais usuários. O uso abusivo deste canal também pode ser moderado.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  reasons: { gap: 9 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.08)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.gold },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.gold },
  reasonText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  selectedText: { color: colors.text },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
