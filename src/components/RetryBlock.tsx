import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function RetryBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Button label="Tentar novamente" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
