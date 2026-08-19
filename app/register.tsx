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
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

const initialForm = {
  name: '',
  email: '',
  whatsapp: '',
  cim: '',
  lodge: '',
  lodgeNumber: '',
  obedience: '',
  city: '',
  region: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterScreen() {
  const { registerPending } = useApp();
  const [form, setForm] = useState(initialForm);
  const [accepted, setAccepted] = useState(false);
  const [eventEmailOptIn, setEventEmailOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const required = [form.name, form.email, form.whatsapp, form.cim, form.lodge, form.city, form.region, form.password, form.confirmPassword];
    if (required.some((value) => !value.trim())) {
      Alert.alert('Cadastro incompleto', 'Preencha os campos obrigatórios para criar sua conta.');
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
    if (form.region.trim().length < 2) {
      Alert.alert('Estado inválido', 'Informe a sigla do estado, por exemplo: SC.');
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
      const region = form.region.trim().toUpperCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone,
            cim,
            lodge_name: form.lodge.trim(),
            lodge_number: form.lodgeNumber.trim(),
            obedience: form.obedience.trim(),
            city: form.city.trim(),
            region,
            event_email_opt_in: eventEmailOptIn,
            terms_version: CONNEXIO.termsVersion,
            privacy_version: CONNEXIO.privacyVersion,
          },
        },
      });
      if (error) throw error;

      registerPending({
        name: form.name.trim(),
        email,
        whatsapp: phone,
        cim,
        city: form.city.trim(),
        region,
        lodge: form.lodge.trim(),
        lodgeNumber: form.lodgeNumber.trim(),
        obedience: form.obedience.trim(),
        eventEmailOptIn,
      });

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
        <Text style={styles.subtitle}>Seus dados maçônicos identificam você nas conexões e ajudam a mostrar eventos da sua região.</Text>
      </View>
      <View style={styles.form}>
        <FormField label="Nome completo *" value={form.name} onChangeText={set('name')} autoCapitalize="words" autoComplete="name" />
        <FormField label="E-mail *" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <FormField label="Telefone / WhatsApp *" value={form.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" autoComplete="tel" />
        <FormField label="Número do CIM *" value={form.cim} onChangeText={set('cim')} keyboardType="number-pad" hint="O CIM é privado e será usado somente na validação." />

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Dados maçônicos</Text>
          <FormField label="Loja Maçônica *" value={form.lodge} onChangeText={set('lodge')} autoCapitalize="words" placeholder="Ex.: Fraternidade e União" />
          <FormField label="Número da Loja" value={form.lodgeNumber} onChangeText={set('lodgeNumber')} keyboardType="number-pad" placeholder="Ex.: 123" />
          <FormField label="Potência / Obediência" value={form.obedience} onChangeText={set('obedience')} autoCapitalize="characters" placeholder="Ex.: GOSP" />
          <FormField label="Oriente / Cidade *" value={form.city} onChangeText={set('city')} autoCapitalize="words" placeholder="Ex.: Florianópolis" />
          <FormField label="Estado *" value={form.region} onChangeText={set('region')} autoCapitalize="characters" maxLength={2} placeholder="SC" />
        </View>

        <View style={styles.preference}>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Receber eventos da minha região</Text>
            <Text style={styles.preferenceText}>Autoriza o Connexio a enviar por e-mail eventos aprovados para sua cidade ou estado. Você poderá desativar no perfil.</Text>
          </View>
          <Switch value={eventEmailOptIn} onValueChange={setEventEmailOptIn} trackColor={{ true: colors.gold }} />
        </View>

        <FormField label="Senha *" value={form.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
        <FormField label="Confirmar senha *" value={form.confirmPassword} onChangeText={set('confirmPassword')} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
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
  group: { gap: 17, paddingTop: 6 },
  groupTitle: { color: colors.goldSoft, fontSize: 16, fontWeight: '900' },
  preference: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  preferenceCopy: { flex: 1, gap: 5 },
  preferenceTitle: { color: colors.cream, fontSize: 14, fontWeight: '800' },
  preferenceText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
