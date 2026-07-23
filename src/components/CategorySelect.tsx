import { CategoryPills } from '@/components/CategoryPills';
import { colors } from '@/theme/colors';
import { CategoryRecord } from '@/types/database';
import { StyleSheet, Text, View } from 'react-native';

export function CategorySelect({ categories, selected, onSelect }: { categories: CategoryRecord[]; selected: string; onSelect: (slug: string) => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Segmento</Text>
      <CategoryPills categories={categories} selected={selected} onSelect={onSelect} includeAll={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  label: { color: colors.cream, fontSize: 14, fontWeight: '800' },
});
