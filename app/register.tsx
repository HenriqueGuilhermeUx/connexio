import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { LegalConsent } from '@/components/LegalConsent';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { CONNEXIO } from '@/lib/constants';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const initialForm = {
  name: '',
  email: '',
  whatsapp: '',
  cim: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterScreen() {
  const { registerPending } = useApp();
  const [form, setForm] = useState(initialForm);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const required = [form.name, form.email, form.whatsapp, form.cim, form.password, form.confirmPassword];
    if (required.some((value) => !value.trim())) {
      Alert.alert('Cadastro incompleto', 'Preencha os campos para criar sua conta.');
      return;
    }
    if (!accepted) {
      Alert.alert('Aceite necessário', 'Leia e aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    if (form.cim.replace(/\D/g, '').length < 4) {
      Alert.alert('CIM inválido', 'Confira o número do CIM informado.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Senha muito curta', 'Use pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Senhas diferentes', 'Digite a mesma senha nos dois campos.');
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const phone = form.whatsapp.replace(/\D/g, '');
      const cim = form.cim.replace(/\D/g, '');

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone,
            cim,
            terms_version: CONNEXIO.termsVersion,
            privacy_version: CONNEXIO.privacyVersion,
          },
        },
      });
      if (error) throw error;

      registerPending({ name: form.name.trim(), email, whatsapp: phone, cim });

      if (!data.session) {
        Alert.alert(
          'Confira seu e-mail',
          'Sua conta foi criada. Confirme o e-mail para entrar no Connexio.',
          [{ text: 'Entendi', onPress: () => router.replace('/login') }],
        );
        return;
      }

      router.replace('/pending');
    } catch (error) {
      Alert.alert('Não foi possível criar a conta', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>CONTA CONNEXIO</Text>
        <Text style={styles.title}>Comece de forma simples</Text>
        <Text style={styles.subtitle}>Depois de entrar, você poderá pesquisar e cadastrar tudo o que oferece enquanto sua validação acontece.</Text>
      </View>
      <View style={styles.form}>
        <FormField label="Nome completo" value={form.name} onChangeText={set('name')} autoCapitalize="words" autoComplete="name" />
        <FormField label="E-mail" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <FormField label="Telefone / WhatsApp" value={form.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" autoComplete="tel" />
        <FormField label="Número do CIM" value={form.cim} onChangeText={set('cim')} keyboardType="number-pad" hint="O CIM é privado e será usado somente na validação." />
        <FormField label="Senha" value={form.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
        <FormField label="Confirmar senha" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
        <LegalConsent accepted={accepted} onChange={setAccepted} />
        <Button label="Criar conta" onPress={() => void submit()} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, gap: 26 },
  intro: { gap: 8 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  form: { gap: 17 },
});
