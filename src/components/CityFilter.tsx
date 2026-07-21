import { colors } from '@/theme/colors';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export function CityFilter({ cities, selected, onSelect }: { cities: string[]; selected: string; onSelect: (city: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {['Todas', ...cities].map((city) => {
        const active = city === selected;
        return (
          <Pressable key={city} onPress={() => onSelect(city)} style={[styles.pill, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{city}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingRight: 20 },
  pill: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  active: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' },
  text: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  activeText: { color: colors.goldSoft },
});
