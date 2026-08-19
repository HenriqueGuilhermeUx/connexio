import { colors } from '@/theme/colors';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function AdminPreviewToggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked: value }}>
      <View style={[styles.box, value && styles.checked]}>{value ? <Text style={styles.check}>✓</Text> : null}</View>
      <View style={styles.copy}>
        <Text style={styles.title}>Mostrar para membros pendentes</Text>
        <Text style={styles.description}>Inclui esta oferta na vitrine limitada, sem liberar contatos.</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.gold, borderColor: colors.gold },
  check: { color: colors.background, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 13, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
});
