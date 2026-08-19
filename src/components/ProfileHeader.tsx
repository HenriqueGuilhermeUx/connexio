import { ProfileStatus } from '@/components/ProfileStatus';
import { colors } from '@/theme/colors';
import { Member } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileHeader({ member }: { member: Member }) {
  const approved = member.status === 'APPROVED';
  const lodge = [
    member.lodgeNumber ? `${member.lodge} nº ${member.lodgeNumber}` : member.lodge,
    member.obedience,
  ].filter(Boolean).join(' · ');

  return (
    <View style={styles.container}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{member.name[0] || 'C'}</Text></View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.name}</Text>
          {approved ? <MaterialCommunityIcons name="check-decagram" size={19} color={colors.gold} /> : null}
        </View>
        <Text style={styles.lodge}>{lodge}</Text>
        <ProfileStatus status={member.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 70, height: 70, borderRadius: 23, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.background, fontSize: 28, fontWeight: '900' },
  copy: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: colors.cream, fontSize: 22, fontWeight: '900', flexShrink: 1 },
  lodge: { color: colors.textMuted, fontSize: 12 },
});
