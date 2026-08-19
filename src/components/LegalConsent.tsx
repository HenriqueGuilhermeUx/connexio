import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function LegalConsent({ accepted, onChange }: { accepted: boolean; onChange: (accepted: boolean) => void }) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => onChange(!accepted)}
        style={[styles.box, accepted && styles.checked]}
      >
        {accepted ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.text}>Li e aceito os documentos do Connexio.</Text>
        <View style={styles.links}>
          <Pressable onPress={() => router.push('/terms')}><Text style={styles.link}>Termos de Uso</Text></Pressable>
          <Text style={styles.separator}>·</Text>
          <Pressable onPress={() => router.push('/privacy')}><Text style={styles.link}>Política de Privacidade</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  box: { width: 25, height: 25, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.gold, borderColor: colors.gold },
  check: { color: colors.background, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 4 },
  text: { color: colors.text, fontSize: 13, lineHeight: 18 },
  links: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  link: { color: colors.goldSoft, fontSize: 12, fontWeight: '800' },
  separator: { color: colors.textMuted, fontSize: 12 },
});
