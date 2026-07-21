import { colors } from '@/theme/colors';
import { PriceType } from '@/types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const options: [PriceType, string][] = [
  ['ON_REQUEST', 'Sob consulta'],
  ['FROM', 'A partir de'],
  ['FIXED', 'Valor fixo'],
];

export function PriceSelector({ value, onChange }: { value: PriceType; onChange: (value: PriceType) => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preço</Text>
      <View style={styles.options}>
        {options.map(([key, label]) => {
          const selected = key === value;
          return (
            <Pressable key={key} onPress={() => onChange(key)} style={[styles.option, selected && styles.selected]}>
              <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 9 },
  label: { color: colors.cream, fontSize: 14, fontWeight: '800' },
  options: { flexDirection: 'row', gap: 7 },
  option: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' },
  text: { color: colors.textMuted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  selectedText: { color: colors.goldSoft },
});
