import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

const initialForm = {
  name: '', email: '', whatsapp: '', cim: '', lodge: '', city: '', region: '',
};

export default function RegisterScreen() {
  const { registerPending } = useApp();
  const [form, setForm] = useState(initialForm);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const missing = Object.entries(form).some(([, value]) => !value.trim());
    if (missing) {
      Alert.alert('Cadastro incompleto', 'Preencha todos os campos para solicitar o acesso.');
      return;
    }
    registerPending(form);
    router.replace('/pending');
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.title}>Identificação do membro</Text>
        <Text style={styles.subtitle}>Seus dados serão usados exclusivamente para validar o acesso à rede.</Text>
      </View>
      <View style={styles.form}>
        <FormField label="Nome completo" value={form.name} onChangeText={set('name')} autoCapitalize="words" />
        <FormField label="E-mail" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="WhatsApp" value={form.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" />
        <FormField label="Número do CIM" value={form.cim} onChangeText={set('cim')} keyboardType="number-pad" hint="O número não será exibido publicamente." />
        <FormField label="Número e nome da Loja" value={form.lodge} onChangeText={set('lodge')} />
        <FormField label="Cidade" value={form.city} onChangeText={set('city')} />
        <FormField label="Região" value={form.region} onChangeText={set('region')} placeholder="Ex.: Baixada Santista" />
        <Button label="Enviar para validação" onPress={submit} />
      </View>
      <Text style={styles.legal}>Ao continuar, você declara que as informações são verdadeiras e aceita os termos de uso e privacidade.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, gap: 26 },
  intro: { gap: 8 },
  title: { color: colors.cream, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  form: { gap: 17 },
  legal: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
