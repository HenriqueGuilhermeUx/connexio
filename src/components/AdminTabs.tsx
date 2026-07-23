import { colors } from '@/theme/colors';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AdminTab = 'MEMBERS' | 'LISTINGS' | 'REPORTS';

export function AdminTabs({
  selected,
  onSelect,
  members,
  listings,
  reports,
}: {
  selected: AdminTab;
  onSelect: (tab: AdminTab) => void;
  members: number;
  listings: number;
  reports: number;
}) {
  return (
    <View style={styles.container}>
      <Tab label={`Membros (${members})`} active={selected === 'MEMBERS'} onPress={() => onSelect('MEMBERS')} />
      <Tab label={`Ofertas (${listings})`} active={selected === 'LISTINGS'} onPress={() => onSelect('LISTINGS')} />
      <Tab label={`Denúncias (${reports})`} active={selected === 'REPORTS'} onPress={() => onSelect('REPORTS')} />
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 4 },
  active: { backgroundColor: colors.gold },
  text: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  activeText: { color: colors.background },
});
