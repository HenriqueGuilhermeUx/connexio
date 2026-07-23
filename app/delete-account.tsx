import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { LegalFooter } from '@/components/LegalFooter';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { deleteMyAccount } from '@/lib/compliance';
import { CONNEXIO } from '@/lib/constants';
import { friendlyError } from '@/lib/errors';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function DeleteAccountScreen() {
  const { member, logout } = useApp();
  const [email, setEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  const requestByEmail = async () => {
    const subject = encodeURIComponent('Solicitação de exclusão de conta Connexio');
    const body = encodeURIComponent('Solicito a exclusão da minha conta e dos dados associados. Meu e-mail de cadastro é: ');
    await Linking.openURL(`mailto:${CONNEXIO.supportEmail}?subject=${subject}&body=${body}`);
  };

  const remove = () => {
    if (!member) return;
    if (email.trim().toLowerCase() !== member.email.toLowerCase()) {
      Alert.alert('Confirmação incorreta', 'Digite exatamente o e-mail da sua conta.');
      return;
    }

    Alert.alert(
      'Excluir conta definitivamente?',
      'Sua conta, ofertas, imagens, favoritos e dados vinculados serão apagados. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir definitivamente',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMyAccount(email);
              await logout().catch(() => undefined);
              Alert.alert('Conta excluída', 'Seus dados associados ao Connexio foram removidos.');
              router.replace('/welcome');
            } catch (error) {
              Alert.alert('Não foi possível excluir', friendlyError(error));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="PRIVACIDADE"
        title="Excluir conta"
        subtitle="O Connexio oferece exclusão dentro do aplicativo e um canal externo para quem não consegue acessar a conta."
      />

      <View style={styles.warning}>
        <Feather name="alert-triangle" size={23} color={colors.danger} />
        <View style={styles.warningCopy}>
          <Text style={styles.warningTitle}>A exclusão é permanente</Text>
          <Text style={styles.warningText}>Serão removidos perfil, validação, ofertas, imagens, contatos, favoritos e denúncias vinculadas. Dados estritamente necessários por obrigação legal ou segurança poderão ser conservados pelo prazo aplicável, quando houver.</Text>
        </View>
      </View>

      {member ? (
        <View style={styles.form}>
          <FormField
            label="Confirme seu e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={member.email}
          />
          <Button label="Excluir minha conta" variant="danger" onPress={remove} loading={deleting} />
        </View>
      ) : (
        <View style={styles.external}>
          <Text style={styles.externalTitle}>Não consegue entrar?</Text>
          <Text style={styles.externalText}>Envie uma solicitação pelo e-mail de suporte usando o mesmo endereço cadastrado. A identidade poderá ser confirmada antes da conclusão.</Text>
          <Button label="Solicitar exclusão por e-mail" variant="secondary" onPress={() => void requestByEmail()} />
          <Text style={styles.address}>{CONNEXIO.supportEmail}</Text>
        </View>
      )}

      <Button label="Ler Política de Privacidade" variant="ghost" onPress={() => router.push('/privacy')} />
      <LegalFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24 },
  warning: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 17, backgroundColor: 'rgba(245,141,141,0.08)', borderWidth: 1, borderColor: colors.danger },
  warningCopy: { flex: 1, gap: 5 },
  warningTitle: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  warningText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  form: { gap: 17 },
  external: { gap: 12, padding: 17, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  externalTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  externalText: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  address: { color: colors.goldSoft, fontSize: 12, textAlign: 'center' },
});
