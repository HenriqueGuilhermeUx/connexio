import { colors } from '@/theme/colors';
import { PropsWithChildren } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  scrollProps?: ScrollViewProps;
}>;

export function Screen({ children, scroll = true, contentStyle, scrollProps }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, contentStyle]}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fixedShell}>
          <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  fixedShell: { flex: 1, width: '100%' },
  flex: { flex: 1 },
});
