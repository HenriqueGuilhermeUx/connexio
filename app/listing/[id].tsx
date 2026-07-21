import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listings, favorites, toggleFavorite } = useApp();
  const listing = listings.find((item) => item.id === id);

  if (!listing) {
    return <Screen><Text style={styles.title}>Oferta não encontrada.</Text></Screen>;
  }

  const favorite = favorites.includes(listing.id);
  const price = listing.price === undefined || listing.priceType === 'ON_REQUEST'
    ? 'Sob consulta'
    : `${listing.priceType === 'FROM' ? 'A partir de ' : ''}${listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

  const openWhatsApp = async () => {
    const message = `Olá, ${listing.ownerName}. Vi sua oferta “${listing.title}” no Connexio e gostaria de mais informações.`;
    const url = `https://wa.me/${listing.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('WhatsApp indisponível', 'Não foi possível abrir o contato neste dispositivo.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.visual}>
        <MaterialCommunityIcons name={listing.type === 'SERVICE' ? 'briefcase-outline' : 'shopping-outline'} size={56} color={colors.gold} />
        <Pressable onPress={() => toggleFavorite(listing.id)} style={styles.favorite}>
          <Feather name="heart" size={22} color={favorite ? colors.gold : colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.category}>{listing.category}</Text>
        <Text style={styles.type}>{listing.type === 'SERVICE' ? 'SERVIÇO' : 'PRODUTO'}</Text>
      </View>
      <Text style={styles.title}>{listing.title}</Text>
      <View style={styles.location}><Feather name="map-pin" size={15} color={colors.textMuted} /><Text style={styles.locationText}>{listing.city} · {listing.region}</Text></View>
      <Text style={styles.price}>{price}</Text>

      {listing.benefit ? (
        <View style={styles.benefitBox}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={23} color={colors.success} />
          <View style={styles.benefitCopy}><Text style={styles.benefitLabel}>Benefício para membros</Text><Text style={styles.benefitText}>{listing.benefit}</Text></View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre a oferta</Text>
        <Text style={styles.description}>{listing.description}</Text>
      </View>

      <View style={styles.ownerCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{listing.ownerName[0]}</Text></View>
        <View style={styles.ownerCopy}>
          <View style={styles.ownerNameRow}><Text style={styles.ownerName}>{listing.ownerName}</Text><MaterialCommunityIcons name="check-decagram" size={18} color={colors.gold} /></View>
          <Text style={styles.lodge}>{listing.ownerLodge}</Text>
          <Text style={styles.verified}>Identidade e vínculo validados</Text>
        </View>
      </View>

      <Button label="Falar no WhatsApp" onPress={openWhatsApp} />
      <Text style={styles.disclaimer}>A negociação acontece diretamente entre os membros. O Connexio não processa pagamentos nesta fase.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  visual: { height: 210, borderRadius: 24, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  favorite: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: colors.goldSoft, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
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
  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.background, fontSize: 20, fontWeight: '900' },
  ownerCopy: { flex: 1, gap: 3 },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  lodge: { color: colors.textMuted, fontSize: 12 },
  verified: { color: colors.goldSoft, fontSize: 11, marginTop: 2 },
  disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
