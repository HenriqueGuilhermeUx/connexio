import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function InlineNotice({ icon = 'info', text }: { icon?: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={16} color={colors.gold} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  text: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
