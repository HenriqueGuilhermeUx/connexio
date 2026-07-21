import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function AdminSummary({ members, listings }: { members: number; listings: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Feather name="shield" size={24} color={colors.gold} /></View>
      <View style={styles.copy}>
        <Text style={styles.value}>{members + listings}</Text>
        <Text style={styles.label}>itens aguardando decisão</Text>
        <Text style={styles.detail}>{members} membros · {listings} ofertas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  icon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  value: { color: colors.cream, fontSize: 25, fontWeight: '900' },
  label: { color: colors.text, fontSize: 13, fontWeight: '700' },
  detail: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
});
