import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { DeveloperCredit } from '@/components/DeveloperCredit';
import { Screen } from '@/components/Screen';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const steps = [
  {
    eyebrow: 'PASSO 1 DE 3',
    icon: 'search' as const,
    title: 'Encontre com facilidade',
    text: 'Pesquise produtos, serviços, profissionais, cidades e segmentos em uma rede de membros verificados.',
  },
  {
    eyebrow: 'PASSO 2 DE 3',
    icon: 'storefront-outline' as const,
    title: 'Ofereça tudo de uma vez',
    text: 'Cadastre sua loja, serviço ou produto com todas as informações. Nada será perdido enquanto sua validação acontece.',
  },
  {
    eyebrow: 'PASSO 3 DE 3',
    icon: 'shield-check-outline' as const,
    title: 'A confiança vem primeiro',
    text: 'Enquanto o cadastro é analisado, você vê uma vitrine limitada. Contatos e publicação pública são liberados após a aprovação manual.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <Screen contentStyle={styles.content}>
      <BrandMark compact />

      <View style={styles.progress}>
        {steps.map((_, index) => (
          <View key={index} style={[styles.progressItem, index <= step && styles.progressActive]} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>{current.eyebrow}</Text>
        <View style={styles.iconWrap}>
          {current.icon === 'search' ? (
            <Feather name="search" size={34} color={colors.gold} />
          ) : (
            <MaterialCommunityIcons name={current.icon} size={38} color={colors.gold} />
          )}
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={last ? 'Criar minha conta' : 'Continuar'}
          onPress={() => last ? router.replace('/register') : setStep((value) => value + 1)}
        />
        {step > 0 ? (
          <Pressable onPress={() => setStep((value) => value - 1)}>
            <Text style={styles.back}>Voltar</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.back}>Já tenho uma conta</Text>
          </Pressable>
        )}
      </View>

      <DeveloperCredit />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingTop: 28, gap: 24 },
  progress: { flexDirection: 'row', gap: 7 },
  progressItem: { flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.gold },
  card: { flex: 1, justifyContent: 'center', gap: 16, paddingVertical: 28 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  iconWrap: { width: 78, height: 78, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.cream, fontSize: 34, lineHeight: 40, fontWeight: '900', letterSpacing: -0.7 },
  text: { color: colors.textMuted, fontSize: 16, lineHeight: 25 },
  actions: { gap: 14 },
  back: { color: colors.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center', paddingVertical: 8 },
});
