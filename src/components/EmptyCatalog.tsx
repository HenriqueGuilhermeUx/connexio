import { Button } from '@/components/Button';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export function EmptyCatalog({ searching = false }: { searching?: boolean }) {
  return (
    <View style={styles.container}>
      <Feather name={searching ? 'search' : 'package'} size={36} color={colors.gold} />
      <Text style={styles.title}>{searching ? 'Nenhum resultado' : 'O catálogo está começando'}</Text>
      <Text style={styles.description}>
        {searching
          ? 'Tente outro termo, cidade ou segmento.'
          : 'Seja um dos primeiros a apresentar um produto, serviço ou negócio à rede.'}
      </Text>
      {!searching ? <Button label="Cadastrar uma oferta" variant="secondary" onPress={() => router.push('/(tabs)/publish')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 10, paddingVertical: 44 },
  title: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 420 },
});
