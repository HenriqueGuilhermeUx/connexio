import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  label: { color: colors.textMuted, fontSize: 12 },
  value: { color: colors.cream, fontSize: 12, fontWeight: '700', textAlign: 'right', flex: 1 },
});
