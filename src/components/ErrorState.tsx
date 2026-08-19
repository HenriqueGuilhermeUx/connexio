import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={34} color={colors.warning} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onRetry ? <Button label="Tentar novamente" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, alignItems: 'center', paddingVertical: 42 },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
