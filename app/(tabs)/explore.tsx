import { CategoryPills } from '@/components/CategoryPills';
import { CityFilter } from '@/components/CityFilter';
import { EmptyCatalog } from '@/components/EmptyCatalog';
import { LoadingState } from '@/components/LoadingState';
import { OfferGrid } from '@/components/OfferGrid';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SearchField } from '@/components/SearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { matchesListing } from '@/lib/search';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function ExploreScreen() {
  const { listings, categories, favorites, dataLoading, toggleFavorite } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState('Todas');

  const catalog = useMemo(
    () => listings.filter((listing) => listing.status === 'PUBLISHED'),
    [listings],
  );

  const cities = useMemo(
    () => [...new Set(catalog.map((listing) => listing.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [catalog],
  );

  const filtered = useMemo(() => catalog.filter((listing) => {
    const matchesCategory = category === 'all' || listing.categorySlug === category;
    const matchesCity = city === 'Todas' || listing.city === city;
    return matchesCategory && matchesCity && matchesListing(listing, query);
  }), [catalog, category, city, query]);

  const favorite = async (listingId: string) => {
    try {
      await toggleFavorite(listingId);
    } catch (error) {
      Alert.alert('Não foi possível salvar', friendlyError(error));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="DESCOBRIR"
        title="Explore a rede"
        subtitle="Pesquise por nome, segmento, cidade, produto, serviço ou profissional."
      />
      <SearchField value={query} onChangeText={setQuery} placeholder="O que você está procurando?" />
      <CategoryPills categories={categories} selected={category} onSelect={setCategory} />
      <CityFilter cities={cities} selected={city} onSelect={setCity} />
      <SectionHeader title="Resultados" subtitle={`${filtered.length} ${filtered.length === 1 ? 'oportunidade' : 'oportunidades'}`} />

      {dataLoading && !listings.length ? (
        <LoadingState label="Pesquisando a rede..." />
      ) : filtered.length ? (
        <OfferGrid listings={filtered} favorites={favorites} onToggleFavorite={(id) => void favorite(id)} />
      ) : (
        <EmptyCatalog searching />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 22 },
});
