import { colors } from '@/theme/colors';
import { Listing } from '@/types';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function priceLabel(listing: Listing) {
  if (listing.priceType === 'ON_REQUEST' || listing.price === undefined) return 'Sob consulta';
  const value = listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return listing.priceType === 'FROM' ? `A partir de ${value}` : value;
}

function typeLabel(listing: Listing) {
  if (listing.type === 'BUSINESS') return 'Loja / negócio';
  if (listing.type === 'SERVICE') return 'Serviço';
  return 'Produto';
}

function typeIcon(listing: Listing): keyof typeof MaterialCommunityIcons.glyphMap {
  if (listing.type === 'BUSINESS') return 'storefront-outline';
  if (listing.type === 'SERVICE') return 'briefcase-outline';
  return 'shopping-outline';
}

type Props = {
  listing: Listing;
  favorite: boolean;
  onToggleFavorite: () => void;
};

export function ListingCard({ listing, favorite, onToggleFavorite }: Props) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.visual}>
        <MaterialCommunityIcons name={typeIcon(listing)} size={34} color={colors.gold} />
        {listing.featured ? <Text style={styles.featured}>Destaque</Text> : null}
        <Pressable
          accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          style={styles.favorite}
        >
          <Feather name="heart" size={20} color={favorite ? colors.gold : colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{listing.category}</Text>
          <Text style={styles.type}>{typeLabel(listing)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={colors.textMuted} />
          <Text style={styles.location}>{listing.city} · {listing.region}</Text>
        </View>
        <Text style={styles.price}>{priceLabel(listing)}</Text>
        {listing.benefit ? <Text style={styles.benefit} numberOfLines={2}>{listing.benefit}</Text> : null}
        <View style={styles.ownerRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{listing.ownerName[0]}</Text></View>
          <View style={styles.ownerText}>
            <View style={styles.verifiedRow}>
              <Text style={styles.ownerName}>{listing.ownerName}</Text>
              {listing.ownerVerified ? <MaterialCommunityIcons name="check-decagram" size={15} color={colors.gold} /> : null}
            </View>
            <Text style={styles.lodge} numberOfLines={1}>{listing.ownerLodge}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  visual: { height: 112, backgroundColor: colors.surfaceRaised, padding: 18, justifyContent: 'flex-end' },
  featured: { position: 'absolute', left: 14, top: 14, color: colors.background, backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 11, fontWeight: '800' },
  favorite: { position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(8,21,38,0.74)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 9 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  category: { color: colors.goldSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 },
  type: { color: colors.textMuted, fontSize: 12 },
  title: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { color: colors.textMuted, fontSize: 13 },
  price: { color: colors.cream, fontSize: 15, fontWeight: '700' },
  benefit: { color: colors.success, fontSize: 13, lineHeight: 18 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cream, fontWeight: '800' },
  ownerText: { flex: 1, gap: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ownerName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  lodge: { color: colors.textMuted, fontSize: 11 },
});
