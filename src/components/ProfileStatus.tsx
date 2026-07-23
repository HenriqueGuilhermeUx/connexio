import { colors } from '@/theme/colors';
import { MemberStatus } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileStatus({ status }: { status: MemberStatus }) {
  const approved = status === 'APPROVED';
  const label = approved ? 'MEMBRO VERIFICADO' : status === 'PENDING' ? 'VALIDAÇÃO EM ANDAMENTO' : status;
  return (
    <View style={[styles.pill, approved ? styles.approved : styles.pending]}>
      <Text style={[styles.text, approved ? styles.approvedText : styles.pendingText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  approved: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.12)' },
  pending: { borderColor: colors.warning, backgroundColor: 'rgba(241,200,107,0.08)' },
  text: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  approvedText: { color: colors.goldSoft },
  pendingText: { color: colors.warning },
});
