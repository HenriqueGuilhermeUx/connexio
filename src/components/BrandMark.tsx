import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, compact && styles.iconCompact]}>
        <MaterialCommunityIcons name="vector-link" size={compact ? 22 : 32} color={colors.background} />
      </View>
      <View>
        <Text style={[styles.name, compact && styles.nameCompact]}>Connexio</Text>
        {!compact ? <Text style={styles.tagline}>Confiança que gera negócios.</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCompact: { width: 40, height: 40, borderRadius: 12 },
  name: { color: colors.cream, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  nameCompact: { fontSize: 22, letterSpacing: -0.4 },
  tagline: { color: colors.textMuted, marginTop: 2, fontSize: 14 },
});
