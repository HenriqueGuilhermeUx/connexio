import { colors } from '@/theme/colors';
import { CategoryRecord } from '@/types/database';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export function CategoryPills({
  categories,
  selected,
  onSelect,
  includeAll = true,
}: {
  categories: CategoryRecord[];
  selected: string;
  onSelect: (slug: string) => void;
  includeAll?: boolean;
}) {
  const items = includeAll ? [{ slug: 'all', name: 'Todos', position: -1, active: true }, ...categories] : categories;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {items.map((item) => {
        const active = selected === item.slug;
        return (
          <Pressable key={item.slug} onPress={() => onSelect(item.slug)} style={[styles.pill, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingRight: 20 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.gold, borderColor: colors.gold },
  text: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  activeText: { color: colors.background },
});
