import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const { loginDemo } = useApp();
  const [email, setEmail] = useState('henrique@connexio.app');
  const [password, setPassword] = useState('connexio');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Preencha seus dados', 'Informe e-mail e senha para continuar.');
      return;
    }
    loginDemo();
    router.replace('/(tabs)');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.subtitle}>Entre para explorar oportunidades da sua rede.</Text>
      </View>
      <View style={styles.form}>
        <FormField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
        <Button label="Entrar no Connexio" onPress={handleLogin} />
      </View>
      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Ambiente de demonstração</Text>
        <Text style={styles.demoText}>Os campos já estão preenchidos. Nesta versão, qualquer senha válida abre o perfil aprovado de demonstração.</Text>
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
  demoBox: { padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  demoTitle: { color: colors.goldSoft, fontSize: 13, fontWeight: '800' },
  demoText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
