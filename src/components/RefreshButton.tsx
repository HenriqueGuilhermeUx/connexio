import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export function RefreshButton({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {loading ? <ActivityIndicator size="small" color={colors.gold} /> : <Feather name="refresh-cw" size={15} color={colors.gold} />}
      <Text style={styles.label}>Atualizar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 38, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  label: { color: colors.goldSoft, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
