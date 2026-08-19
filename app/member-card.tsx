import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, Text, View } from 'react-native';

export default function MemberCardScreen() {
  const { member, lodge, membership } = useApp();

  if (!member || !lodge || !membership) {
    return (
      <Screen contentStyle={styles.content}>
        <Text style={styles.title}>Carteirinha indisponível</Text>
        <Text style={styles.muted}>Seu vínculo com uma Loja ainda precisa ser validado.</Text>
        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const credential = JSON.stringify({
    type: 'CONNEXIO_MEMBER',
    memberId: member.id,
    membershipId: membership.id,
    lodgeId: lodge.id,
    version: 1,
  });

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>IDENTIDADE CONNEXIO</Text>
        <Text style={styles.title}>Carteirinha digital</Text>
        <Text style={styles.muted}>Credencial de vínculo para uso dentro do ecossistema Connexio.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.brand}>CONNEXIO</Text>
            <Text style={styles.cardLabel}>MEMBRO VERIFICADO</Text>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={30} color={colors.gold} />
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{member.name[0]}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.lodge}>{lodge.name}{lodge.number ? ` nº ${lodge.number}` : ''}</Text>
            <Text style={styles.orient}>Oriente de {lodge.orient}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.qrArea}>
          <View style={styles.qrBox}>
            <QRCode value={credential} size={132} backgroundColor="#FFFFFF" color="#111111" />
          </View>
          <View style={styles.qrCopy}>
            <Text style={styles.qrTitle}>QR verificável</Text>
            <Text style={styles.qrText}>A leitura identifica a credencial. A validação definitiva será feita pelo backend Connexio.</Text>
            <View style={styles.activePill}><Text style={styles.activeText}>VÍNCULO ATIVO</Text></View>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.small}>CIM {member.cimMasked}</Text>
          <Text style={styles.small}>v1</Text>
        </View>
      </View>

      <View style={styles.notice}>
        <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.gold} />
        <Text style={styles.noticeText}>O QR não expõe e-mail, telefone ou CIM completo. Na etapa de backend, a consulta retornará apenas os dados autorizados e o status do vínculo.</Text>
      </View>

      <Button label="Voltar ao perfil" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 22 },
  header: { gap: 7 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.cream, fontSize: 27, fontWeight: '900' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.gold, padding: 20, gap: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.cream, fontSize: 20, fontWeight: '900', letterSpacing: 1.2 },
  cardLabel: { color: colors.goldSoft, marginTop: 4, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.background, fontSize: 25, fontWeight: '900' },
  identityCopy: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  lodge: { color: colors.goldSoft, fontSize: 12, fontWeight: '700' },
  orient: { color: colors.textMuted, fontSize: 11 },
  divider: { height: 1, backgroundColor: colors.border },
  qrArea: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  qrBox: { padding: 9, borderRadius: 14, backgroundColor: '#FFFFFF' },
  qrCopy: { flex: 1, gap: 7 },
  qrTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  qrText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
  activePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(209,174,87,0.12)', borderWidth: 1, borderColor: colors.gold },
  activeText: { color: colors.goldSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: colors.textMuted, fontSize: 10 },
  notice: { flexDirection: 'row', gap: 11, backgroundColor: colors.surfaceRaised, borderRadius: 16, padding: 15, borderWidth: 1, borderColor: colors.border },
  noticeText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, flex: 1 },
});
