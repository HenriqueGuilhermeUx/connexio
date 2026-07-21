import { EmptyState } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export default function FavoritesScreen() {
  const { listings, favorites, toggleFavorite } = useApp();
  const items = listings.filter((listing) => favorites.includes(listing.id));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>SUA CURADORIA</Text>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.subtitle}>Salve profissionais e ofertas para encontrar novamente com facilidade.</Text>
      </View>
      <View style={styles.list}>
        {items.length ? items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} favorite onToggleFavorite={() => toggleFavorite(listing.id)} />
        )) : <EmptyState title="Nenhum favorito ainda" description="Toque no coração de uma oferta para criar sua lista pessoal." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 26 },
  intro: { gap: 8 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  list: { gap: 16 },
});
