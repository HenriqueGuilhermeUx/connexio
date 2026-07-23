import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { OfferGrid } from '@/components/OfferGrid';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { Alert, StyleSheet } from 'react-native';

export default function FavoritesScreen() {
  const { listings, favorites, dataLoading, toggleFavorite } = useApp();
  const items = listings.filter((listing) => listing.status === 'PUBLISHED' && favorites.includes(listing.id));

  const remove = async (listingId: string) => {
    try {
      await toggleFavorite(listingId);
    } catch (error) {
      Alert.alert('Não foi possível atualizar', friendlyError(error));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="SUA CURADORIA"
        title="Favoritos"
        subtitle="Salve profissionais e ofertas para encontrar novamente com facilidade."
      />
      {dataLoading && !listings.length ? (
        <LoadingState label="Carregando favoritos..." />
      ) : items.length ? (
        <OfferGrid listings={items} favorites={favorites} onToggleFavorite={(id) => void remove(id)} />
      ) : (
        <EmptyState title="Nenhum favorito ainda" description="Toque no coração de uma oferta para criar sua lista pessoal." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 26 },
});
