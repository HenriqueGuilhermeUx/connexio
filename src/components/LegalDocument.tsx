import { DeveloperCredit } from '@/components/DeveloperCredit';
import { colors } from '@/theme/colors';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function LegalDocument({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Última atualização: {updatedAt}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      <DeveloperCredit />
    </View>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 24 },
  header: { gap: 6 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '900' },
  updated: { color: colors.textMuted, fontSize: 11 },
  body: { gap: 20 },
  section: { gap: 7 },
  sectionTitle: { color: colors.goldSoft, fontSize: 16, fontWeight: '900' },
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
});
