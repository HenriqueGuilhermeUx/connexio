import { colors } from '@/theme/colors';
import { StyleSheet, Text } from 'react-native';

export function OfferCount({ count }: { count: number }) {
  return <Text style={styles.text}>{count} {count === 1 ? 'oportunidade' : 'oportunidades'}</Text>;
}

const styles = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 12 },
});
