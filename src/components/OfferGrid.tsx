import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';
import { StyleSheet, View } from 'react-native';

export function OfferGrid({
  listings,
  favorites,
  onToggleFavorite,
}: {
  listings: Listing[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {listings.map((listing) => (
        <View key={listing.id} style={styles.item}>
          <ListingCard
            listing={listing}
            favorite={favorites.includes(listing.id)}
            onToggleFavorite={() => onToggleFavorite(listing.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  item: { width: '100%', flexGrow: 1, flexBasis: 300 },
});
