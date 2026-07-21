import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Feather name="search" size={28} color={colors.gold} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 44, paddingHorizontal: 24, alignItems: 'center', gap: 10 },
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
