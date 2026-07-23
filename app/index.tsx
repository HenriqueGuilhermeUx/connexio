import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const { member, sessionLoading } = useApp();

  if (sessionLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!member) return <Redirect href="/welcome" />;
  if (member.status === 'APPROVED') return <Redirect href="/(tabs)" />;
  return <Redirect href="/pending" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
