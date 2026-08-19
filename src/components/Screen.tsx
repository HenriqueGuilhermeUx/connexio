import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, ScrollViewProps, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle; scrollProps?: ScrollViewProps }>;

const managerRoutes = [
  { label: 'Visão geral', icon: 'grid' as const, route: '/manager' as const },
  { label: 'Hoje na Loja', icon: 'activity' as const, route: '/manager-today' as const },
  { label: 'Semáforo', icon: 'pie-chart' as const, route: '/manager-health' as const },
  { label: 'Membros', icon: 'users' as const, route: '/lodge-members' as const },
  { label: 'Acompanhamento', icon: 'heart' as const, route: '/manager-people' as const },
  { label: 'Sessões', icon: 'calendar' as const, route: '/manager-sessions' as const },
  { label: 'Comunicados', icon: 'bell' as const, route: '/manager-communications' as const },
  { label: 'Agenda', icon: 'briefcase' as const, route: '/manager-agenda' as const },
  { label: 'Votações', icon: 'check-square' as const, route: '/manager-voting' as const },
  { label: 'Candidatos', icon: 'user-plus' as const, route: '/manager-candidates' as const },
  { label: 'Educação', icon: 'book-open' as const, route: '/manager-education' as const },
  { label: 'Planejamento', icon: 'target' as const, route: '/manager-planning' as const },
  { label: 'Atas', icon: 'file-text' as const, route: '/manager-minutes' as const },
  { label: 'Transição', icon: 'repeat' as const, route: '/manager-transition' as const },
  { label: 'Gestor Pro', icon: 'layers' as const, route: '/manager-pro' as const },
  { label: 'Tesouraria', icon: 'dollar-sign' as const, route: '/manager-finance' as const },
  { label: 'Cobranças', icon: 'credit-card' as const, route: '/manager-charges' as const },
  { label: 'Obrigações', icon: 'clock' as const, route: '/manager-obligations' as const },
];

export function Screen({ children, scroll = true, contentStyle, scrollProps }: Props) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const managerArea = pathname === '/manager' || pathname === '/lodge-members' || pathname.startsWith('/manager-');
  const desktopManager = Platform.OS === 'web' && width >= 960 && managerArea;
  const body = scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={[styles.content, desktopManager && styles.desktopContent, contentStyle]} {...scrollProps}>{children}</ScrollView> : <View style={styles.fixedShell}><View style={[styles.content, desktopManager && styles.desktopContent, styles.flex, contentStyle]}>{children}</View></View>;

  return <SafeAreaView style={styles.safe} edges={['top']}>{desktopManager ? <View style={styles.desktopShell}><View style={styles.sidebar}><View style={styles.sidebarBrand}><Text style={styles.sidebarEyebrow}>CONNEXIO</Text><Text style={styles.sidebarTitle}>Gestor</Text><Text style={styles.sidebarText}>Sistema Operacional da Loja</Text></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarNav}>{managerRoutes.map((item) => { const active = pathname === item.route; return <Pressable key={item.route} onPress={() => router.push(item.route)} style={[styles.navItem, active && styles.navItemActive]}><Feather name={item.icon} size={17} color={active ? colors.gold : colors.textMuted} /><Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text></Pressable>; })}</ScrollView><View style={styles.sidebarFooter}><Text style={styles.sidebarFooterText}>Gestão segura · Android + Web</Text></View></View><View style={styles.desktopMain}>{body}</View></View> : body}</SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, scroll: { flex: 1 }, content: { width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 32 }, desktopContent: { maxWidth: 1320, paddingHorizontal: 30 }, fixedShell: { flex: 1, width: '100%' }, flex: { flex: 1 }, desktopShell: { flex: 1, flexDirection: 'row', width: '100%' }, desktopMain: { flex: 1, minWidth: 0 }, sidebar: { width: 248, padding: 20, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface, gap: 18 }, sidebarBrand: { gap: 3, paddingHorizontal: 7 }, sidebarEyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, sidebarTitle: { color: colors.cream, fontSize: 23, fontWeight: '900' }, sidebarText: { color: colors.textMuted, fontSize: 10 }, sidebarNav: { gap: 4, paddingBottom: 8 }, navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, paddingHorizontal: 11, borderRadius: 12 }, navItemActive: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border }, navText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' }, navTextActive: { color: colors.cream, fontWeight: '900' }, sidebarFooter: { padding: 10, borderRadius: 12, backgroundColor: colors.surfaceRaised }, sidebarFooterText: { color: colors.textMuted, fontSize: 9, lineHeight: 14, textAlign: 'center' } });
