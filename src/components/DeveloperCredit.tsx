import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export function DeveloperCredit() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Desenvolvido por</Text>
      <Text style={styles.company}>Alternative Ventures</Text>
      <Text style={styles.cnpj}>CNPJ 61.920.356/0001-38</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  label: { color: colors.textMuted, fontSize: 10 },
  company: { color: colors.goldSoft, fontSize: 11, fontWeight: '800' },
  cnpj: { color: colors.textMuted, fontSize: 9 },
});
