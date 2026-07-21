import { listingStatusLabel } from '@/lib/format';
import { colors } from '@/theme/colors';
import { ListingStatus } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

export function OwnOfferBadge({ status }: { status?: ListingStatus }) {
  if (!status || status === 'PUBLISHED') return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{listingStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: colors.warning, backgroundColor: 'rgba(241,200,107,0.08)', paddingHorizontal: 9, paddingVertical: 5 },
  text: { color: colors.warning, fontSize: 9, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
});
