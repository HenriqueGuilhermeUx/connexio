import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function PendingScreen() {
  const { member, logout } = useApp();

  return (
    <Screen contentStyle={styles.content}>
      <BrandMark compact />
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="shield-check-outline" size={46} color={colors.gold} />
        </View>
        <Text style={styles.title}>Solicitação em análise</Text>
        <Text style={styles.text}>Recebemos seu cadastro{member?.name ? `, ${member.name.split(' ')[0]}` : ''}. A administração verificará o CIM e a Loja informados.</Text>
        <View style={styles.statusBox}>
          <View style={styles.dot} />
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>Status atual</Text>
            <Text style={styles.statusValue}>Aguardando validação manual</Text>
          </View>
        </View>
        <Text style={styles.helper}>Quando o acesso for aprovado, você receberá uma notificação. Nenhum dado do CIM será exibido no perfil público.</Text>
      </View>
      <Button label="Voltar ao início" variant="secondary" onPress={() => { logout(); router.replace('/welcome'); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 24, justifyContent: 'space-between', gap: 36 },
  center: { alignItems: 'center', gap: 16 },
  iconWrap: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { color: colors.cream, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  statusBox: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.warning },
  statusText: { gap: 2 },
  statusLabel: { color: colors.textMuted, fontSize: 12 },
  statusValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
