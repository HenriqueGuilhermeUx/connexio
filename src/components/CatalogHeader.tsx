import { BrandMark } from '@/components/BrandMark';
import { RefreshButton } from '@/components/RefreshButton';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function CatalogHeader() {
  const { member, dataLoading, refreshData } = useApp();
  return (
    <View style={styles.container}>
      <BrandMark compact />
      <View style={styles.actions}>
        <View style={styles.location}>
          <Feather name="map-pin" size={13} color={colors.gold} />
          <Text style={styles.locationText}>{member?.city || 'São Paulo'}</Text>
        </View>
        <RefreshButton loading={dataLoading} onPress={() => void refreshData()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  locationText: { color: colors.cream, fontSize: 12, fontWeight: '800' },
});
