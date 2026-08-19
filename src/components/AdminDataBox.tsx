import { colors } from '@/theme/colors';
import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function AdminDataBox({ children }: PropsWithChildren) {
  return <View style={styles.box}>{children}</View>;
}

const styles = StyleSheet.create({
  box: { gap: 10, padding: 13, borderRadius: 14, backgroundColor: colors.surfaceRaised },
});
