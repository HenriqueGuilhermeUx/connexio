import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { buildCredentialVerificationUrl, getMemberCredentialToken } from '@/lib/credentials';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function MemberCardScreen() {
  const { member, lodge, membership } = useApp();
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  useEffect(() => {
    if (!membership) return;
    setLoadingToken(true);
    void getMemberCredentialToken(membership.id)
      .then((value) => setToken(value ?? null))
      .catch(() => setToken(null))
      .finally(() => setLoadingToken(false));
  }, [membership]);

  const credentialValue = useMemo(() => {
    if (token) return buildCredentialVerificationUrl(token);
    if (!member || !membership || !lodge) return '';
    return JSON.stringify({ type: 'CONNEXIO_MEMBER_DEMO', memberId: member.id, membershipId: membership.id, lodgeId: lodge.id, version: 1 });
  }, [token, member, membership, lodge]);

  if (!member || !lodge || !membership) {
    return (
      <Screen contentStyle={styles.content}>
        <Text style={styles.title}>Carteirinha indisponível</Text>
        <Text style={styles.muted}>Seu vínculo com uma Loja ainda precisa ser validado.</Text>
        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

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
            {loadingToken ? <ActivityIndicator color="#111111" /> : <QRCode value={credentialValue} size={132} backgroundColor="#FFFFFF" color="#111111" />}
          </View>
          <View style={styles.qrCopy}>
            <Text style={styles.qrTitle}>QR verificável</Text>
            <Text style={styles.qrText}>{token ? 'A leitura consulta uma credencial opaca e revogável no backend Connexio.' : 'Modo demonstração: a validação remota será ativada quando o backend estiver configurado.'}</Text>
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
        <Text style={styles.noticeText}>O QR não expõe e-mail, telefone ou CIM completo. A validação retorna somente nome, Loja, Oriente, cargo e situação da credencial.</Text>
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
  qrBox: { width: 150, height: 150, padding: 9, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
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
