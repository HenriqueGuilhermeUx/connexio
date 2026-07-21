import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Preencha seus dados', 'Informe e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const member = await login(email, password);
      if (member.status === 'REJECTED' || member.status === 'SUSPENDED') {
        router.replace('/pending');
        return;
      }
      router.replace(member.status === 'PENDING' ? '/pending' : '/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Confira seu e-mail e senha.';
      Alert.alert('Não foi possível entrar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.subtitle}>Entre para pesquisar oportunidades ou cuidar do que você oferece.</Text>
      </View>
      <View style={styles.form}>
        <FormField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <FormField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
        <Button label={loading ? 'Entrando...' : 'Entrar no Connexio'} onPress={handleLogin} disabled={loading} />
        <Pressable onPress={() => router.push('/onboarding')}>
          <Text style={styles.create}>Ainda não tenho conta</Text>
        </Pressable>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Acesso gradual</Text>
        <Text style={styles.infoText}>Enquanto sua identificação é validada, você já pode pesquisar uma seleção de ofertas e cadastrar tudo o que oferece.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 28 },
  intro: { gap: 8 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  form: { gap: 18 },
  create: { color: colors.goldSoft, fontSize: 13, fontWeight: '800', textAlign: 'center', paddingVertical: 8 },
  infoBox: { padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  infoTitle: { color: colors.goldSoft, fontSize: 13, fontWeight: '800' },
  infoText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
