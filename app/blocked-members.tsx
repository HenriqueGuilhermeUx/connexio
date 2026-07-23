import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function BlockedMembersScreen() {
  const { blockedMembers, unblockMember } = useApp();

  const confirmUnblock = (id: string, name: string) => {
    Alert.alert(
      'Desbloquear anunciante?',
      `As ofertas de ${name} poderão voltar a aparecer no catálogo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear',
          onPress: () => {
            void (async () => {
              try {
                await unblockMember(id);
                Alert.alert('Anunciante desbloqueado', 'As ofertas poderão voltar a aparecer.');
              } catch (error) {
                Alert.alert('Não foi possível desbloquear', friendlyError(error));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="PRIVACIDADE"
        title="Anunciantes bloqueados"
        subtitle="Controle quais anunciantes e ofertas ficam ocultos para você."
      />

      {blockedMembers.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="user-check" size={28} color={colors.goldSoft} />
          <Text style={styles.emptyTitle}>Nenhum anunciante bloqueado</Text>
          <Text style={styles.emptyText}>Ao bloquear um anunciante, todas as ofertas dele deixam de aparecer no seu catálogo.</Text>
        </View>
      ) : (
        blockedMembers.map((blocked) => (
          <View key={blocked.id} style={styles.card}>
            <View style={styles.identity}>
              <View style={styles.icon}>
                <Feather name="user-x" size={21} color={colors.danger} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{blocked.name}</Text>
                <Text style={styles.note}>Ofertas ocultadas do seu catálogo</Text>
              </View>
            </View>
            <Button
              label="Desbloquear"
              variant="secondary"
              onPress={() => confirmUnblock(blocked.id, blocked.name)}
            />
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  empty: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { color: colors.cream, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  card: {
    gap: 14,
    padding: 17,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,141,141,0.08)',
  },
  copy: { flex: 1, gap: 3 },
  name: { color: colors.cream, fontSize: 16, fontWeight: '800' },
  note: { color: colors.textMuted, fontSize: 12 },
});
