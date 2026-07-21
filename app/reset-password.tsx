import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { updatePassword } from '@/lib/compliance';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [preparing, setPreparing] = useState(Boolean(code));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code)
      .catch((error) => Alert.alert('Link inválido', friendlyError(error)))
      .finally(() => setPreparing(false));
  }, [code]);

  const save = async () => {
    if (password.length < 6) {
      Alert.alert('Senha muito curta', 'Use pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmation) {
      Alert.alert('Senhas diferentes', 'Digite a mesma senha nos dois campos.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      Alert.alert('Senha atualizada', 'Você já pode entrar usando a nova senha.', [
        { text: 'Continuar', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível atualizar', friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  if (preparing) return <Screen><LoadingState label="Validando o link seguro..." /></Screen>;

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle eyebrow="SEGURANÇA" title="Criar nova senha" subtitle="Escolha uma senha que você não use em outros serviços." />
      <FormField label="Nova senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
      <FormField label="Confirmar nova senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
      <Button label="Salvar nova senha" onPress={() => void save()} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
});
