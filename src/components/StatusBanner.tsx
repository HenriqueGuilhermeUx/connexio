import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  description: string;
  tone?: 'info' | 'warning' | 'success';
};

export function StatusBanner({ title, description, tone = 'info' }: Props) {
  const accent = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.gold;
  const icon = tone === 'success' ? 'check-circle' : tone === 'warning' ? 'clock' : 'info';

  return (
    <View style={[styles.container, { borderColor: accent }]}>
      <Feather name={icon} size={20} color={accent} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: accent }]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1 },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 12, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
