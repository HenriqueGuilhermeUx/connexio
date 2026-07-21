import { colors } from '@/theme/colors';
import { ListingType } from '@/types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const options: [ListingType, string][] = [
  ['BUSINESS', 'Loja / negócio'],
  ['SERVICE', 'Serviço'],
  ['PRODUCT', 'Produto'],
];

export function OfferTypeSelector({ value, onChange }: { value: ListingType; onChange: (value: ListingType) => void }) {
  return (
    <View style={styles.container}>
      {options.map(([key, label]) => {
        const selected = value === key;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4 },
  item: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 5 },
  selected: { backgroundColor: colors.gold },
  text: { color: colors.textMuted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  selectedText: { color: colors.background },
});
