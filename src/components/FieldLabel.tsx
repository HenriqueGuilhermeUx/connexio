import { colors } from '@/theme/colors';
import { StyleSheet, Text } from 'react-native';

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { color: colors.cream, fontSize: 14, fontWeight: '800' },
});
