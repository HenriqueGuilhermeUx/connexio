import { colors } from '@/theme/colors';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AdminTab = 'MEMBERS' | 'LISTINGS';

export function AdminTabs({ selected, onSelect, members, listings }: { selected: AdminTab; onSelect: (tab: AdminTab) => void; members: number; listings: number }) {
  return (
    <View style={styles.container}>
      <Tab label={`Membros (${members})`} active={selected === 'MEMBERS'} onPress={() => onSelect('MEMBERS')} />
      <Tab label={`Ofertas (${listings})`} active={selected === 'LISTINGS'} onPress={() => onSelect('LISTINGS')} />
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  active: { backgroundColor: colors.gold },
  text: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  activeText: { color: colors.background },
});
