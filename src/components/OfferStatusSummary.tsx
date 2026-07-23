import { listingStatusLabel } from '@/lib/format';
import { colors } from '@/theme/colors';
import { ListingStatus } from '@/types';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function OfferStatusSummary({ status }: { status?: ListingStatus }) {
  if (!status || status === 'PUBLISHED') return null;
  const description = status === 'PENDING_MEMBER_APPROVAL'
    ? 'Todos os dados estão salvos. A oferta ficará privada até sua validação.'
    : status === 'PENDING_REVIEW'
      ? 'A administração está revisando o conteúdo antes da publicação.'
      : status === 'REJECTED'
        ? 'A oferta precisa de ajustes antes de uma nova análise.'
        : 'Esta oferta não aparece no catálogo neste momento.';

  return (
    <View style={styles.container}>
      <Feather name="clock" size={20} color={colors.warning} />
      <View style={styles.copy}>
        <Text style={styles.title}>{listingStatusLabel(status)}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 15, backgroundColor: 'rgba(241,200,107,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,107,0.28)' },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.warning, fontSize: 12, fontWeight: '900' },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
