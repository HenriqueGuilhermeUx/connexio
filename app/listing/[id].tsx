import { ContactButton } from '@/components/ContactButton';
import { ContactLock } from '@/components/ContactLock';
import { OfferContact } from '@/components/OfferContact';
import { OfferImage } from '@/components/OfferImage';
import { OfferOwnerCard } from '@/components/OfferOwnerCard';
import { OfferStatusSummary } from '@/components/OfferStatusSummary';
import { Screen } from '@/components/Screen';
import { WebsiteButton } from '@/components/WebsiteButton';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { listingPriceLabel, listingTypeLabel } from '@/lib/format';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { member, listings, favorites, toggleFavorite } = useApp();
  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return <Screen><Text style={styles.title}>Oferta não encontrada ou indisponível.</Text></Screen>;
  }

  const own = listing.ownerId === member?.id;
  const approved = member?.status === 'APPROVED';
  const published = listing.status === 'PUBLISHED';
  const contactAllowed = approved && published && !own;
  const favorite = favorites.includes(listing.id);

  const favoriteOffer = async () => {
    try {
      await toggleFavorite(listing.id);
    } catch (error) {
      Alert.alert('Não foi possível atualizar', friendlyError(error));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View>
        <OfferImage uri={listing.imageUrl} type={listing.type} style={styles.visual} iconSize={56} />
        {!own ? (
          <Pressable onPress={() => void favoriteOffer()} style={styles.favorite}>
            <Feather name="heart" size={22} color={favorite ? colors.gold : colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {own ? <OfferStatusSummary status={listing.status} /> : null}
      {!approved && published ? <ContactLock /> : null}

      <View style={styles.metaRow}>
        <Text style={styles.category}>{listing.category}</Text>
        <Text style={styles.type}>{listingTypeLabel(listing.type).toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>{listing.title}</Text>
      <View style={styles.location}>
        <Feather name="map-pin" size={15} color={colors.textMuted} />
        <Text style={styles.locationText}>{listing.city} · {listing.region}</Text>
      </View>
      <Text style={styles.price}>{listingPriceLabel(listing)}</Text>

      {listing.benefit ? (
        <View style={styles.benefitBox}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={23} color={colors.success} />
          <View style={styles.benefitCopy}>
            <Text style={styles.benefitLabel}>Benefício para membros</Text>
            <Text style={styles.benefitText}>{listing.benefit}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre a oferta</Text>
        <Text style={styles.description}>{listing.description}</Text>
      </View>

      <OfferOwnerCard listing={listing} />

      {contactAllowed ? (
        <OfferContact email={listing.contactEmail} phone={listing.phone} website={listing.website} />
      ) : null}
      {contactAllowed ? <WebsiteButton url={listing.website} /> : null}
      {!own ? <ContactButton listing={listing} allowed={contactAllowed} /> : null}

      <Text style={styles.disclaimer}>A negociação acontece diretamente entre os membros. O Connexio não processa pagamentos nesta fase.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  visual: { height: 230, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  favorite: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(8,21,38,0.84)', alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  category: { color: colors.goldSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7, flex: 1 },
  type: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  title: { color: colors.cream, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: colors.textMuted, fontSize: 14 },
  price: { color: colors.text, fontSize: 18, fontWeight: '800' },
  benefitBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 17, backgroundColor: 'rgba(111,214,165,0.08)', borderWidth: 1, borderColor: 'rgba(111,214,165,0.35)' },
  benefitCopy: { flex: 1, gap: 3 },
  benefitLabel: { color: colors.success, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  benefitText: { color: colors.cream, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  section: { gap: 9 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 23 },
  disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
