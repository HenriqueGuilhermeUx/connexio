import { colors } from '@/theme/colors';
import { ListingType } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

function iconFor(type: ListingType): keyof typeof MaterialCommunityIcons.glyphMap {
  if (type === 'BUSINESS') return 'storefront-outline';
  if (type === 'SERVICE') return 'briefcase-outline';
  return 'shopping-outline';
}

export function OfferImage({
  uri,
  type,
  style,
  iconSize = 38,
}: {
  uri?: string;
  type: ListingType;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
      ) : (
        <MaterialCommunityIcons name={iconFor(type)} size={iconSize} color={colors.gold} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
