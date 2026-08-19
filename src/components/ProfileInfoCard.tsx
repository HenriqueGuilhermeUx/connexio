import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileInfoCard({ rows }: { rows: { icon: keyof typeof Feather.glyphMap; label: string; value: string }[] }) {
  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={styles.icon}><Feather name={row.icon} size={17} color={colors.gold} /></View>
          <View style={styles.copy}><Text style={styles.label}>{row.label}</Text><Text style={styles.value}>{row.value || '—'}</Text></View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  label: { color: colors.textMuted, fontSize: 11 },
  value: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
