import { CONNEXIO } from '@/lib/constants';
import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function LegalFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Desenvolvido por {CONNEXIO.company}</Text>
      <Text style={styles.text}>CNPJ {CONNEXIO.cnpj}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  text: { color: colors.textMuted, fontSize: 9 },
});
