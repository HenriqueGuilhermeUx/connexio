import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function AdminEmpty({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Feather name="check-circle" size={34} color={colors.success} />
      <Text style={styles.title}>Fila concluída</Text>
      <Text style={styles.description}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 44 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
