import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { DeveloperCredit } from '@/components/DeveloperCredit';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function PendingScreen() {
  const { member, logout } = useApp();
  const pending = member?.status === 'PENDING';
  const rejected = member?.status === 'REJECTED';
  const suspended = member?.status === 'SUSPENDED';

  const leave = () => {
    logout();
    router.replace('/welcome');
  };

  if (rejected || suspended) {
    return (
      <Screen contentStyle={styles.content}>
        <BrandMark compact />
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="shield-alert-outline" size={46} color={colors.warning} />
          </View>
          <Text style={styles.title}>{rejected ? 'Cadastro não aprovado' : 'Acesso suspenso'}</Text>
          <Text style={styles.text}>Entre em contato com a administração do Connexio para consultar o motivo e solicitar uma revisão.</Text>
        </View>
        <Button label="Sair da conta" variant="secondary" onPress={leave} />
        <DeveloperCredit />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <BrandMark compact />

      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.status}>VALIDAÇÃO EM ANDAMENTO</Text>
        </View>
        <Text style={styles.title}>Olá, {member?.name?.split(' ')[0] ?? 'membro'}.</Text>
        <Text style={styles.text}>
          Seu cadastro foi recebido. Enquanto verificamos o CIM, você já pode conhecer o Connexio e preparar sua oferta completa.
        </Text>
      </View>

      <View style={styles.actionsGrid}>
        <View style={styles.actionCard}>
          <View style={styles.actionIcon}><Feather name="search" size={25} color={colors.gold} /></View>
          <Text style={styles.actionTitle}>Quero procurar</Text>
          <Text style={styles.actionText}>Pesquise uma seleção de produtos, serviços e profissionais.</Text>
          <Button label="Pesquisar ofertas" variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionIcon}><MaterialCommunityIcons name="storefront-outline" size={28} color={colors.gold} /></View>
          <Text style={styles.actionTitle}>Quero oferecer</Text>
          <Text style={styles.actionText}>Cadastre sua loja, serviço ou produto com todas as informações.</Text>
          <Button label="Cadastrar minha oferta" onPress={() => router.replace('/(tabs)/publish')} />
        </View>
      </View>

      {pending ? (
        <View style={styles.notice}>
          <MaterialCommunityIcons name="lock-check-outline" size={22} color={colors.warning} />
          <Text style={styles.noticeText}>Até a aprovação, contatos ficam ocultos e sua oferta permanece privada. Nenhuma informação preenchida será perdida.</Text>
        </View>
      ) : null}

      <Button label="Sair da conta" variant="secondary" onPress={leave} />
      <DeveloperCredit />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 24, gap: 26 },
  header: { gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.warning },
  status: { color: colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  center: { alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' },
  iconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.cream, fontSize: 30, fontWeight: '900' },
  text: { color: colors.textMuted, fontSize: 15, lineHeight: 23 },
  actionsGrid: { gap: 14 },
  actionCard: { gap: 10, padding: 17, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  actionText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  notice: { flexDirection: 'row', gap: 11, padding: 15, borderRadius: 16, backgroundColor: 'rgba(241,200,107,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,107,0.28)' },
  noticeText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
});
