import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type SelectedPhoto = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export function PhotoPicker({ photos, onChange }: { photos: SelectedPhoto[]; onChange: (photos: SelectedPhoto[]) => void }) {
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - photos.length),
      quality: 0.85,
    });
    if (result.canceled) return;
    const selected = result.assets.map((asset) => ({ uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName }));
    onChange([...photos, ...selected].slice(0, 5));
  };

  const remove = (uri: string) => onChange(photos.filter((photo) => photo.uri !== uri));

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.picker}
        onPress={() => photos.length >= 5 ? Alert.alert('Limite de fotos', 'Você pode adicionar até 5 imagens por oferta.') : void pick()}
      >
        <View style={styles.icon}><Feather name="camera" size={23} color={colors.gold} /></View>
        <View style={styles.copy}>
          <Text style={styles.title}>{photos.length ? 'Adicionar mais fotos' : 'Adicionar fotos'}</Text>
          <Text style={styles.subtitle}>{photos.length}/5 imagens selecionadas</Text>
        </View>
        <Feather name="plus" size={20} color={colors.textMuted} />
      </Pressable>

      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
              <Pressable accessibilityLabel={`Remover foto ${index + 1}`} onPress={() => remove(photo.uri)} style={styles.remove}>
                <Feather name="x" size={16} color={colors.cream} />
              </Pressable>
              {index === 0 ? <Text style={styles.cover}>CAPA</Text> : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  picker: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 14, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 11 },
  photos: { gap: 10, paddingRight: 20 },
  photoWrap: { width: 118, height: 96, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  photo: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(8,21,38,0.82)', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', left: 7, bottom: 7, color: colors.background, backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
});
