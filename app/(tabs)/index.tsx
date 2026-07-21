import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { categories } from '@/data/mock';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const { member, listings, favorites, toggleFavorite } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return listings.filter((listing) => {
      const matchesCategory = category === 'Todos' || listing.category === category;
      const haystack = `${listing.title} ${listing.description} ${listing.category} ${listing.city} ${listing.region}`.toLocaleLowerCase('pt-BR');
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, listings, query]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <BrandMark compact />
        <View style={styles.location}>
          <Feather name="map-pin" size={13} color={colors.gold} />
          <Text style={styles.locationText}>{member?.city ?? 'São Paulo'}</Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.greeting}>Olá, {member?.name.split(' ')[0] ?? 'membro'}.</Text>
        <Text style={styles.title}>O que você procura hoje?</Text>
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Serviço, produto ou cidade"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
        {query ? <Pressable onPress={() => setQuery('')}><Feather name="x" size={19} color={colors.textMuted} /></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {categories.map((item) => {
          const selected = category === item;
          return (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryPill, selected && styles.categorySelected]}>
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{category === 'Todos' ? 'Oportunidades da rede' : category}</Text>
          <Text style={styles.sectionSubtitle}>{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {filtered.length ? filtered.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            favorite={favorites.includes(listing.id)}
            onToggleFavorite={() => toggleFavorite(listing.id)}
          />
        )) : <EmptyState title="Nenhuma oferta encontrada" description="Tente outra categoria ou termo de busca. Esta busca também será valiosa para mapear demandas sem oferta." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  locationText: { color: colors.cream, fontSize: 12, fontWeight: '700' },
  intro: { gap: 4 },
  greeting: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.cream, fontSize: 29, lineHeight: 35, fontWeight: '800' },
  searchBox: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  categories: { gap: 9, paddingRight: 20 },
  categoryPill: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  categorySelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  categoryText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  categoryTextSelected: { color: colors.background },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  list: { gap: 16 },
});
