import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
});
