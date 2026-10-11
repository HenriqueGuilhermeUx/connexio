import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const pillars = [
  {
    icon: 'handshake-outline' as const,
    eyebrow: 'NEGÓCIOS ENTRE MEMBROS',
    title: 'Encontre quem você já pode confiar.',
    text: 'Produtos, serviços e profissionais de membros verificados, próximos a você.',
  },
  {
    icon: 'store-cog-outline' as const,
    eyebrow: 'CONNEXIO GESTOR',
    title: 'Sua Loja organizada em um só lugar.',
    text: 'Membros, sessões, comunicados, agenda, votações, frequência e uma gestão avançada para Secretários, Tesoureiros e Veneráveis.',
  },
] as const;

const trustPoints = [
  ['account-check-outline', 'Comunidade de membros verificados'],
  ['shield-check-outline', 'Acesso privado e confiança da irmandade'],
  ['cellphone-link', 'Negócios e gestão no app e no computador'],
] as const;

export default function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandMark />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>REDE PRIVADA • NEGÓCIOS • GESTÃO DE LOJAS</Text>
          <Text style={styles.title}>A rede da irmandade para conectar, negociar e gerir.</Text>
          <Text style={styles.subtitle}>
            Uma comunidade privada que une confiança entre membros, oportunidades de negócios e ferramentas para organizar a vida da Loja.
          </Text>
        </View>
      </View>

      <View style={styles.pillars}>
        {pillars.map((pillar) => (
          <View key={pillar.eyebrow} style={styles.pillarCard}>
            <View style={styles.pillarIcon}>
              <MaterialCommunityIcons name={pillar.icon} size={24} color={colors.gold} />
            </View>
            <View style={styles.pillarCopy}>
              <Text style={styles.pillarEyebrow}>{pillar.eyebrow}</Text>
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Text style={styles.pillarText}>{pillar.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.trustPoints}>
        {trustPoints.map(([icon, label]) => (
          <View key={label} style={styles.trustRow}>
            <MaterialCommunityIcons name={icon} size={19} color={colors.gold} />
            <Text style={styles.trustText}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Entrar no Connexio" onPress={() => router.push('/login')} />
        <Button label="Solicitar acesso" variant="secondary" onPress={() => router.push('/register')} />
        <Text style={styles.notice}>Acesso exclusivo a membros mediante validação de vínculo.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 42, gap: 32 },
  hero: { gap: 34 },
  copy: { gap: 12, maxWidth: 850 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.25 },
  title: { color: colors.cream, fontSize: 40, lineHeight: 45, fontWeight: '900', letterSpacing: -1.25 },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, maxWidth: 760 },
  pillars: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  pillarCard: { flex: 1, minWidth: 280, flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillarIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(209,174,87,0.10)', alignItems: 'center', justifyContent: 'center' },
  pillarCopy: { flex: 1, gap: 5 },
  pillarEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  pillarTitle: { color: colors.cream, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  pillarText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  trustPoints: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trustRow: { flexGrow: 1, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 11, borderRadius: 14, backgroundColor: colors.surfaceRaised },
  trustText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  actions: { gap: 12, paddingBottom: 8 },
  notice: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
});
