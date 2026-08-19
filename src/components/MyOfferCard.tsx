import { OfferImage } from '@/components/OfferImage';
import { OwnOfferBadge } from '@/components/OwnOfferBadge';
import { listingPriceLabel } from '@/lib/format';
import { colors } from '@/theme/colors';
import { Listing } from '@/types';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function MyOfferCard({ listing }: { listing: Listing }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })} style={styles.card}>
      <OfferImage uri={listing.imageUrl} type={listing.type} style={styles.image} iconSize={28} />
      <View style={styles.copy}>
        <OwnOfferBadge status={listing.status} />
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.meta}>{listing.category} · {listing.city}</Text>
        <Text style={styles.price}>{listingPriceLabel(listing)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 13, padding: 13, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  image: { width: 88, minHeight: 98, borderRadius: 14 },
  copy: { flex: 1, gap: 6 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900' },
  meta: { color: colors.textMuted, fontSize: 11 },
  price: { color: colors.cream, fontSize: 13, fontWeight: '800' },
});
