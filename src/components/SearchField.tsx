import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export function SearchField({ value, onChangeText, placeholder = 'Pesquisar' }: { value: string; onChangeText: (value: string) => void; placeholder?: string }) {
  return (
    <View style={styles.container}>
      <Feather name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value ? (
        <Pressable accessibilityLabel="Limpar pesquisa" onPress={() => onChangeText('')} hitSlop={8}>
          <Feather name="x" size={19} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  input: { flex: 1, color: colors.text, fontSize: 15 },
});
