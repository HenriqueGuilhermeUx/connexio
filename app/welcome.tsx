import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { DeveloperCredit } from '@/components/DeveloperCredit';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const benefits = [
  ['account-check-outline', 'Membros verificados'],
  ['map-search-outline', 'Pesquisa simples por cidade e segmento'],
  ['storefront-outline', 'Oferta fácil de produtos e serviços'],
] as const;

export default function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandMark />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>REDE PRIVADA DE NEGÓCIOS</Text>
          <Text style={styles.title}>Encontre quem você já pode confiar.</Text>
          <Text style={styles.subtitle}>
            Pesquise oportunidades ou apresente o que você oferece. Tudo de forma simples.
          </Text>
        </View>
      </View>

      <View style={styles.benefits}>
        {benefits.map(([icon, label]) => (
          <View key={label} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <MaterialCommunityIcons name={icon} size={21} color={colors.gold} />
            </View>
            <Text style={styles.benefitText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Conhecer o Connexio" onPress={() => router.push('/onboarding')} />
        <Button label="Já tenho uma conta" variant="secondary" onPress={() => router.push('/login')} />
        <Text style={styles.notice}>Acesso à rede completa e aos contatos após validação manual.</Text>
        <DeveloperCredit />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 48, gap: 42 },
  hero: { gap: 50 },
  copy: { gap: 14 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.cream, fontSize: 42, lineHeight: 47, fontWeight: '800', letterSpacing: -1.4 },
  subtitle: { color: colors.textMuted, fontSize: 17, lineHeight: 25 },
  benefits: { gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  benefitText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  actions: { gap: 12, paddingBottom: 8 },
  notice: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
