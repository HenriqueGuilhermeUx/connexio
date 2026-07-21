import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function OfferContact({ email, phone, website }: { email?: string; phone?: string; website?: string }) {
  const rows = [
    email ? { icon: 'mail' as const, label: email } : null,
    phone ? { icon: 'phone' as const, label: phone } : null,
    website ? { icon: 'globe' as const, label: website } : null,
  ].filter(Boolean) as { icon: keyof typeof Feather.glyphMap; label: string }[];

  if (!rows.length) return null;
  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <View key={`${row.icon}-${row.label}`} style={styles.row}>
          <Feather name={row.icon} size={16} color={colors.gold} />
          <Text style={styles.text}>{row.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, padding: 15, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  text: { color: colors.text, fontSize: 13, flex: 1 },
});
