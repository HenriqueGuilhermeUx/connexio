import { EmptyState } from '@/components/EmptyState';
import { MyOfferCard } from '@/components/MyOfferCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Listing } from '@/types';
import { StyleSheet, View } from 'react-native';

export function OwnOffersSection({ listings }: { listings: Listing[] }) {
  return (
    <View style={styles.container}>
      <SectionHeader title="Minhas ofertas" subtitle={`${listings.length} ${listings.length === 1 ? 'cadastro' : 'cadastros'}`} />
      {listings.length ? (
        <View style={styles.list}>{listings.map((listing) => <MyOfferCard key={listing.id} listing={listing} />)}</View>
      ) : (
        <EmptyState title="Nenhuma oferta cadastrada" description="Apresente sua loja, serviço ou produto para começar." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 13 },
  list: { gap: 11 },
});
