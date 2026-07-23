import { listingStatusLabel } from '@/lib/format';
import { colors } from '@/theme/colors';
import { ListingStatus } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

export function ListingStatusChip({ status }: { status?: ListingStatus }) {
  if (!status) return null;
  const published = status === 'PUBLISHED';
  return (
    <View style={[styles.chip, published ? styles.published : styles.pending]}>
      <Text style={[styles.text, published ? styles.publishedText : styles.pendingText]}>{listingStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  published: { borderColor: colors.success, backgroundColor: 'rgba(111,214,165,0.08)' },
  pending: { borderColor: colors.warning, backgroundColor: 'rgba(241,200,107,0.08)' },
  text: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase' },
  publishedText: { color: colors.success },
  pendingText: { color: colors.warning },
});
