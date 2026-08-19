import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const freeFeatures = [
  ['users', 'Membros', 'Cadastros, vínculos e cargos', '/lodge-members'],
  ['bell', 'Comunicados', 'Avisos e push para os membros', null],
  ['calendar', 'Agenda e eventos', 'Datas, participantes e presença', null],
  ['check-square', 'Votações', 'Enquetes e votações simples', null],
] as const;

const proFeatures = [
  ['credit-card', 'Cobranças', 'Mensalidades e cobranças da Loja'],
  ['trending-up', 'Contas a receber', 'Receitas, baixas e vencimentos'],
  ['trending-down', 'Contas a pagar', 'Despesas, obrigações e recorrências'],
  ['paperclip', 'Comprovantes', 'Guarda organizada de documentos financeiros'],
] as const;

export default function ManagerScreen() {
  const { lodge, membership, managementRequests, member } = useApp();
  const canManage = membership?.role === 'WORSHIPFUL_MASTER' || membership?.role === 'SECRETARY' || membership?.role === 'TREASURER';
  const latestRequest = managementRequests.find((request) => request.requesterId === member?.id);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONNEXIO GESTOR</Text>
        <Text style={styles.title}>{lodge?.name ?? 'Gestão da Loja'}</Text>
        <Text style={styles.muted}>{canManage ? `Acesso ativo como ${roleLabel(membership?.role)}.` : 'Seu perfil ainda não possui permissão de gestão nesta Loja.'}</Text>
      </View>

      {!canManage ? (
        <View style={styles.accessCard}>
          <View style={styles.accessIcon}><Feather name="shield" size={22} color={colors.gold} /></View>
          <View style={styles.accessCopy}>
            <Text style={styles.accessTitle}>Você faz parte da administração?</Text>
            <Text style={styles.accessText}>Venerável, Secretário ou Tesoureiro podem solicitar o acesso enviando uma comprovação.</Text>
            {latestRequest ? <Text style={styles.requestStatus}>Solicitação mais recente: {requestLabel(latestRequest.status)}</Text> : null}
          </View>
          <Button label="Solicitar gestão" onPress={() => router.push('/manager-onboarding')} />
        </View>
      ) : (
        <Button label="Cadastrar ou assumir outra Loja" variant="secondary" onPress={() => router.push('/manager-onboarding')} />
      )}

      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planName}>Gestor</Text>
            <Text style={styles.planPrice}>Grátis</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>ATIVO</Text></View>
        </View>
        <Text style={styles.planDescription}>Tudo para organizar membros, comunicação, agenda e participação da Loja.</Text>
      </View>

      <View style={styles.grid}>
        {freeFeatures.map(([icon, title, description, route]) => (
          <FeatureCard key={title} icon={icon} title={title} description={description} disabled={!canManage} onPress={route && canManage ? () => router.push(route) : undefined} />
        ))}
      </View>

      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <View style={styles.proIcon}><MaterialCommunityIcons name="crown-outline" size={24} color={colors.gold} /></View>
          <View style={styles.proCopy}>
            <Text style={styles.proTitle}>Gestor Pro</Text>
            <Text style={styles.proPrice}>R$ 49,90/mês por Loja</Text>
          </View>
        </View>
        <Text style={styles.proDescription}>A camada operacional para aliviar a rotina do Secretário e do Tesoureiro.</Text>
        <View style={styles.proList}>
          {proFeatures.map(([icon, title, description]) => (
            <View key={title} style={styles.proRow}>
              <Feather name={icon} size={18} color={colors.gold} />
              <View style={styles.proRowCopy}><Text style={styles.proRowTitle}>{title}</Text><Text style={styles.proRowText}>{description}</Text></View>
            </View>
          ))}
        </View>
        <View style={styles.voiceTeaser}>
          <Feather name="mic" size={19} color={colors.gold} />
          <Text style={styles.voiceText}>Em breve: lançamentos, consultas e lembretes por voz para Secretário e Tesoureiro.</Text>
        </View>
        <Button label="Conhecer o Gestor Pro" onPress={() => {}} />
      </View>

      <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function FeatureCard({ icon, title, description, disabled, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; description: string; disabled?: boolean; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.featureCard, disabled && styles.featureDisabled]}>
      <View style={styles.featureIcon}><Feather name={icon} size={20} color={colors.gold} /></View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{description}</Text>
      {onPress ? <Text style={styles.openText}>Abrir →</Text> : <Text style={styles.soonText}>Em construção</Text>}
    </Pressable>
  );
}

function roleLabel(role?: string) {
  if (role === 'WORSHIPFUL_MASTER') return 'Venerável Mestre';
  if (role === 'SECRETARY') return 'Secretário';
  if (role === 'TREASURER') return 'Tesoureiro';
  return 'Membro';
}

function requestLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  if (status === 'PENDING') return 'aguardando análise';
  if (status === 'APPROVED') return 'aprovada';
  return 'rejeitada';
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 },
  header: { gap: 6 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.cream, fontSize: 26, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  accessCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.gold, padding: 16, gap: 13 },
  accessIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  accessCopy: { gap: 4 },
  accessTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  accessText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  requestStatus: { color: colors.goldSoft, fontSize: 10, fontWeight: '700', marginTop: 3 },
  planCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { color: colors.text, fontSize: 19, fontWeight: '800' },
  planPrice: { color: colors.goldSoft, fontSize: 13, marginTop: 2, fontWeight: '700' },
  planDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  badge: { borderRadius: 999, borderWidth: 1, borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.12)', paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { color: colors.goldSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: { width: '48%', minHeight: 160, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  featureDisabled: { opacity: 0.55 },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  featureTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  featureText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  openText: { color: colors.goldSoft, fontSize: 10, fontWeight: '800', marginTop: 'auto' },
  soonText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 'auto' },
  proCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.gold, padding: 18, gap: 14 },
  proHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(209,174,87,0.12)', alignItems: 'center', justifyContent: 'center' },
  proCopy: { flex: 1 },
  proTitle: { color: colors.cream, fontSize: 19, fontWeight: '900' },
  proPrice: { color: colors.goldSoft, fontSize: 13, fontWeight: '800', marginTop: 2 },
  proDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  proList: { gap: 12 },
  proRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  proRowCopy: { flex: 1, gap: 2 },
  proRowTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  proRowText: { color: colors.textMuted, fontSize: 10 },
  voiceTeaser: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center' },
  voiceText: { flex: 1, color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
