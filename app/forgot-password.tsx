import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { sendPasswordReset } from '@/lib/compliance';
import { friendlyError } from '@/lib/errors';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function ForgotPasswordScreen() {
  const { member } = useApp();
  const [email, setEmail] = useState(member?.email ?? '');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail', 'Digite o endereço usado no cadastro.');
      return;
    }
    setSending(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      Alert.alert('E-mail enviado', 'Confira sua caixa de entrada e o spam para criar uma nova senha.');
    } catch (error) {
      Alert.alert('Não foi possível enviar', friendlyError(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="SEGURANÇA"
        title="Recuperar senha"
        subtitle="Enviaremos um link seguro para o e-mail da sua conta."
      />
      <FormField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Button label="Enviar link de recuperação" onPress={() => void send()} loading={sending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24 },
});
