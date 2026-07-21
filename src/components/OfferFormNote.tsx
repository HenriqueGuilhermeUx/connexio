import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function OfferFormNote({ pending }: { pending: boolean }) {
  return (
    <View style={styles.container}>
      <Feather name={pending ? 'lock' : 'check-circle'} size={19} color={pending ? colors.warning : colors.success} />
      <Text style={styles.text}>
        {pending
          ? 'Você pode preencher tudo. A oferta ficará privada até a aprovação do seu cadastro e a revisão do conteúdo.'
          : 'A oferta será enviada para uma revisão rápida antes de aparecer no catálogo.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
