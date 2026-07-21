import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AdminDecisionCard({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function AdminActions({
  onReject,
  onApprove,
  approving = false,
  rejecting = false,
  approveLabel = 'Aprovar',
}: {
  onReject: () => void;
  onApprove: () => void;
  approving?: boolean;
  rejecting?: boolean;
  approveLabel?: string;
}) {
  return (
    <View style={styles.actions}>
      <Button label="Rejeitar" variant="danger" onPress={onReject} loading={rejecting} style={styles.action} />
      <Button label={approveLabel} onPress={onApprove} loading={approving} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 15, padding: 16, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  header: { gap: 4 },
  title: { color: colors.text, fontSize: 17, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 46 },
});
