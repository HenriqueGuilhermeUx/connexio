import { Screen } from '@/components/Screen';
import { categories } from '@/data/mock';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const regions = ['Grande São Paulo', 'Baixada Santista', 'Campinas e Região', 'Ribeirão Preto e Região'];

export default function ExploreScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>DESCOBRIR</Text>
        <Text style={styles.title}>Explore a rede</Text>
        <Text style={styles.subtitle}>Navegue por especialidade e localização. Na próxima etapa, estes filtros serão conectados à busca persistente.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.grid}>
          {categories.filter((item) => item !== 'Todos').map((item, index) => (
            <Pressable key={item} onPress={() => router.push('/(tabs)')} style={styles.categoryCard}>
              <View style={styles.categoryIcon}>
                <MaterialCommunityIcons name={index % 2 === 0 ? 'briefcase-outline' : 'storefront-outline'} size={22} color={colors.gold} />
              </View>
              <Text style={styles.categoryName}>{item}</Text>
              <Feather name="chevron-right" size={17} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Regiões em destaque</Text>
        <View style={styles.regionList}>
          {regions.map((region) => (
            <Pressable key={region} style={styles.regionRow}>
              <Feather name="map" size={18} color={colors.gold} />
              <Text style={styles.regionName}>{region}</Text>
              <Feather name="arrow-up-right" size={17} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 30 },
  intro: { gap: 8 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  section: { gap: 14 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  grid: { gap: 10 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  categoryIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  categoryName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  regionList: { gap: 10 },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  regionName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
});
