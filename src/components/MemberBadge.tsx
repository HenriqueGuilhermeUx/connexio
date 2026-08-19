import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function MemberBadge({ verified }: { verified: boolean }) {
  return (
    <View style={[styles.badge, verified ? styles.verified : styles.pending]}>
      <MaterialCommunityIcons name={verified ? 'check-decagram' : 'clock-outline'} size={14} color={verified ? colors.gold : colors.warning} />
      <Text style={[styles.text, verified ? styles.verifiedText : styles.pendingText]}>{verified ? 'VERIFICADO' : 'EM VALIDAÇÃO'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  verified: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' },
  pending: { borderColor: colors.warning, backgroundColor: 'rgba(241,200,107,0.08)' },
  text: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  verifiedText: { color: colors.goldSoft },
  pendingText: { color: colors.warning },
});
