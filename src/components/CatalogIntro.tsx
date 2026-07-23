import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function CatalogIntro({ firstName }: { firstName?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {firstName || 'membro'}.</Text>
      <Text style={styles.title}>O que você procura hoje?</Text>
      <Text style={styles.subtitle}>Pesquise por produto, serviço, profissional, segmento ou cidade.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  greeting: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.cream, fontSize: 29, lineHeight: 35, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
