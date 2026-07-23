import { MemberBadge } from '@/components/MemberBadge';
import { colors } from '@/theme/colors';
import { Listing } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

export function OfferOwnerCard({ listing }: { listing: Listing }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{listing.ownerName[0] || 'C'}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.name}>{listing.ownerName}</Text>
        <Text style={styles.lodge}>{listing.ownerLodge}</Text>
        <MemberBadge verified={listing.ownerVerified} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.background, fontSize: 20, fontWeight: '900' },
  copy: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 16, fontWeight: '900' },
  lodge: { color: colors.textMuted, fontSize: 12 },
});
