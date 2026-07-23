import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileStats({ offers, city }: { offers: number; city: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}><Text style={styles.value}>{offers}</Text><Text style={styles.label}>Ofertas</Text></View>
      <View style={styles.divider} />
      <View style={styles.stat}><Text style={styles.value}>{city || '—'}</Text><Text style={styles.label}>Cidade</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 17 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  value: { color: colors.text, fontSize: 17, fontWeight: '900' },
  label: { color: colors.textMuted, fontSize: 11 },
  divider: { width: 1, backgroundColor: colors.border },
});
