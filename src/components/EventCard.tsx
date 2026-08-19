import { ConnexioEvent } from '@/types';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function eventDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function EventCard({ event, compact = false }: { event: ConnexioEvent; compact?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={[styles.image, compact && styles.compactImage]} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder, compact && styles.compactImage]}>
          <Feather name="calendar" size={32} color={colors.gold} />
        </View>
      )}
      <View style={styles.copy}>
        <View style={styles.badges}>
          {event.featured ? <Text style={styles.featured}>DESTAQUE</Text> : null}
          <Text style={styles.scope}>{event.city} · {event.region}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.date}>{eventDate(event.startsAt)}</Text>
        <Text style={styles.venue} numberOfLines={1}>{event.venue}</Text>
        <Text style={styles.lodge} numberOfLines={1}>{event.lodgeName}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  compact: { flexDirection: 'row', minHeight: 150 },
  image: { width: '100%', height: 190, backgroundColor: colors.surfaceRaised },
  compactImage: { width: 132, height: '100%', minHeight: 150 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 7, padding: 16 },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  featured: { color: colors.background, backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  scope: { color: colors.goldSoft, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.cream, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  date: { color: colors.text, fontSize: 13, fontWeight: '800' },
  venue: { color: colors.textMuted, fontSize: 13 },
  lodge: { color: colors.textMuted, fontSize: 11 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
});
