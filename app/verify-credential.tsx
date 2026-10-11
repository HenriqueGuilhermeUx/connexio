import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { verifyMemberCredential, CredentialVerification } from '@/lib/credentials';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function VerifyCredentialScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [result, setResult] = useState<CredentialVerification | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setFailed(true);
      return;
    }
    void verifyMemberCredential(token)
      .then((value) => {
        setResult(value);
        setFailed(!value);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CONNEXIO</Text>
        <Text style={styles.title}>Verificação de credencial</Text>
        <Text style={styles.subtitle}>Consulta segura do vínculo apresentado pela carteirinha digital.</Text>
      </View>

      {loading ? (
        <View style={styles.stateCard}><ActivityIndicator color={colors.gold} /><Text style={styles.stateText}>Validando credencial…</Text></View>
      ) : result ? (
        <View style={[styles.resultCard, result.valid ? styles.validCard : styles.invalidCard]}>
          <View style={styles.resultHeader}>
            <MaterialCommunityIcons name={result.valid ? 'shield-check' : 'shield-alert'} size={34} color={result.valid ? colors.success : colors.danger} />
            <View style={styles.resultCopy}>
              <Text style={styles.resultTitle}>{result.valid ? 'Credencial válida' : 'Credencial inválida'}</Text>
              <Text style={styles.resultSubtitle}>{result.valid ? 'Vínculo ativo e confirmado pelo Connexio.' : 'O vínculo não está ativo ou a credencial foi revogada.'}</Text>
            </View>
          </View>
          <View style={styles.dataBox}>
            <Data label="Membro" value={result.memberName} />
            <Data label="Loja" value={`${result.lodgeName}${result.lodgeNumber ? ` nº ${result.lodgeNumber}` : ''}`} />
            <Data label="Oriente" value={result.orient} />
            <Data label="Cargo" value={roleLabel(result.role)} />
          </View>
          <View style={styles.privacy}><Feather name="lock" size={15} color={colors.gold} /><Text style={styles.privacyText}>E-mail, telefone e CIM completo não são exibidos nesta validação.</Text></View>
        </View>
      ) : failed ? (
        <View style={styles.stateCard}><Feather name="x-circle" size={30} color={colors.danger} /><Text style={styles.stateTitle}>Não foi possível validar</Text><Text style={styles.stateText}>A credencial não existe, expirou, foi revogada ou o backend ainda não está conectado.</Text></View>
      ) : null}

      <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return <View style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>;
}

function roleLabel(role: string) {
  if (role === 'WORSHIPFUL_MASTER') return 'Venerável Mestre';
  if (role === 'SECRETARY') return 'Secretário';
  if (role === 'TREASURER') return 'Tesoureiro';
  return 'Membro';
}

const styles = StyleSheet.create({
  content: { paddingTop: 28, gap: 22 },
  header: { gap: 6 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.cream, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  stateCard: { alignItems: 'center', gap: 9, padding: 30, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stateTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  stateText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  resultCard: { gap: 16, padding: 18, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1 },
  validCard: { borderColor: colors.success },
  invalidCard: { borderColor: colors.danger },
  resultHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  resultCopy: { flex: 1, gap: 3 },
  resultTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  resultSubtitle: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  dataBox: { gap: 10, padding: 14, borderRadius: 15, backgroundColor: colors.surfaceRaised },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dataLabel: { color: colors.textMuted, fontSize: 10 },
  dataValue: { flex: 1, color: colors.cream, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  privacy: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  privacyText: { flex: 1, color: colors.textMuted, fontSize: 9, lineHeight: 14 },
});
