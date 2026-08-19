import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ContactLock() {
  return (
    <View style={styles.container}>
      <Feather name="lock" size={18} color={colors.warning} />
      <Text style={styles.text}>Contato disponível após a validação do seu cadastro.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  text: { color: colors.warning, fontSize: 12, fontWeight: '700' },
});
