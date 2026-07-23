import { Button } from '@/components/Button';
import { CatalogHeader } from '@/components/CatalogHeader';
import { CatalogIntro } from '@/components/CatalogIntro';
import { CategoryPills } from '@/components/CategoryPills';
import { EmptyCatalog } from '@/components/EmptyCatalog';
import { EventCard } from '@/components/EventCard';
import { LoadingState } from '@/components/LoadingState';
import { OfferGrid } from '@/components/OfferGrid';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { VerificationNotice } from '@/components/VerificationNotice';
import { useApp } from '@/context/AppContext';
import { eventMatchesMember, loadEvents } from '@/lib/events';
import { friendlyError } from '@/lib/errors';
import { matchesListing } from '@/lib/search';
import { ConnexioEvent } from '@/types';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { member, status, listings, categories, favorites, dataLoading, toggleFavorite } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [events, setEvents] = useState<ConnexioEvent[]>([]);

  useEffect(() => {
    void loadEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const publicCatalog = useMemo(
    () => listings.filter((listing) => listing.status === 'PUBLISHED'),
    [listings],
  );

  const filtered = useMemo(() => publicCatalog.filter((listing) => {
    const matchesCategory = category === 'all' || listing.categorySlug === category;
    return matchesCategory && matchesListing(listing, query);
  }), [category, publicCatalog, query]);

  const regionalEvents = useMemo(
    () => events
      .filter((event) => event.status === 'PUBLISHED' && eventMatchesMember(event, member?.city, member?.region))
      .slice(0, 3),
    [events, member?.city, member?.region],
  );

  const favorite = async (listingId: string) => {
    try {
      await toggleFavorite(listingId);
    } catch (error) {
      Alert.alert('Não foi possível salvar', friendlyError(error));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <CatalogHeader />
      <CatalogIntro firstName={member?.name.split(' ')[0]} />
      <VerificationNotice status={status} />

      {regionalEvents.length ? (
        <View style={styles.eventsSection}>
          <SectionHeader
            title="Eventos na sua região"
            subtitle="Agenda aprovada para membros do Connexio"
          />
          <View style={styles.eventList}>
            {regionalEvents.map((event) => <EventCard key={event.id} event={event} compact />)}
          </View>
          <Button label="Ver agenda completa" variant="secondary" onPress={() => router.push('/events')} />
        </View>
      ) : (
        <Button label="Abrir agenda de eventos" variant="secondary" onPress={() => router.push('/events')} />
      )}

      <SearchField value={query} onChangeText={setQuery} placeholder="Produto, serviço, profissional ou cidade" />
      <CategoryPills categories={categories} selected={category} onSelect={setCategory} />

      <SectionHeader
        title={category === 'all' ? 'Oportunidades da rede' : categories.find((item) => item.slug === category)?.name || 'Resultados'}
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`}
      />

      {dataLoading && !listings.length ? (
        <LoadingState label="Carregando oportunidades..." />
      ) : filtered.length ? (
        <OfferGrid listings={filtered} favorites={favorites} onToggleFavorite={(id) => void favorite(id)} />
      ) : (
        <EmptyCatalog searching={Boolean(query || category !== 'all')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, gap: 22 },
  eventsSection: { gap: 14 },
  eventList: { gap: 12 },
});
