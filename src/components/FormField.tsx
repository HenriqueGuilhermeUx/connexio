import { colors } from '@/theme/colors';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function FormField({ label, hint, multiline, ...props }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  multiline: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
