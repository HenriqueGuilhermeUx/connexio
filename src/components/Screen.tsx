import { useApp } from '@/context/AppContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, ScrollViewProps, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle; scrollProps?: ScrollViewProps }>;

const managerRoutes = [
  { label:'Visão geral',icon:'grid' as const,route:'/manager' as const,pro:false },
  { label:'Membros',icon:'users' as const,route:'/lodge-members' as const,pro:false },
  { label:'Sessões',icon:'calendar' as const,route:'/manager-sessions' as const,pro:false },
  { label:'Comunicados',icon:'bell' as const,route:'/manager-communications' as const,pro:false },
  { label:'Publicar',icon:'send' as const,route:'/manager-publish' as const,pro:false },
  { label:'Agenda',icon:'briefcase' as const,route:'/manager-agenda' as const,pro:false },
  { label:'Votações',icon:'check-square' as const,route:'/manager-voting' as const,pro:false },
  { label:'Gestor Pro',icon:'layers' as const,route:'/manager-pro' as const,pro:false },
  { label:'Voz',icon:'mic' as const,route:'/manager-voice' as const,pro:true },
  { label:'Hoje na Loja',icon:'activity' as const,route:'/manager-today' as const,pro:true },
  { label:'Semáforo',icon:'pie-chart' as const,route:'/manager-health' as const,pro:true },
  { label:'Acompanhamento',icon:'heart' as const,route:'/manager-people' as const,pro:true },
  { label:'Candidatos',icon:'user-plus' as const,route:'/manager-candidates' as const,pro:true },
  { label:'Educação',icon:'book-open' as const,route:'/manager-education' as const,pro:true },
  { label:'Documentos',icon:'folder' as const,route:'/manager-documents' as const,pro:true },
  { label:'Planejamento',icon:'target' as const,route:'/manager-planning' as const,pro:true },
  { label:'Atas',icon:'file-text' as const,route:'/manager-minutes' as const,pro:true },
  { label:'Transição',icon:'repeat' as const,route:'/manager-transition' as const,pro:true },
  { label:'Tesouraria',icon:'dollar-sign' as const,route:'/manager-finance' as const,pro:true },
  { label:'Cobranças Pix',icon:'credit-card' as const,route:'/manager-charges' as const,pro:true },
  { label:'Obrigações',icon:'clock' as const,route:'/manager-obligations' as const,pro:true },
];

function fallbackRoute(pathname: string) {
  if (pathname === '/admin-pro') return '/admin';
  if (pathname === '/admin') return '/profile';
  if (pathname === '/management-request' || pathname === '/member-card' || pathname === '/lodge-hub') return '/profile';
  if (pathname === '/lodge-members') return '/manager';
  if (pathname === '/manager') return '/profile';
  if (pathname.startsWith('/manager-')) return '/manager';
  return null;
}

export function Screen({ children, scroll = true, contentStyle, scrollProps }: Props) {
  const pathname = usePathname();
  const { lodge } = useApp();
  const { width } = useWindowDimensions();
  const [livePlan,setLivePlan]=useState<'FREE'|'PRO'|null>(null);
  const managerArea = pathname === '/manager' || pathname === '/lodge-members' || pathname.startsWith('/manager-');
  const desktopManager = Platform.OS === 'web' && width >= 960 && managerArea;
  const proActive = !isSupabaseConfigured || (livePlan ?? lodge?.plan) === 'PRO';
  const fallback = fallbackRoute(pathname);

  useEffect(()=>{
    if(!lodge||!isSupabaseConfigured||!supabase){setLivePlan(null);return;}
    void supabase.from('lodges').select('plan').eq('id',lodge.id).single().then(({data,error})=>{
      if(!error)setLivePlan(data?.plan==='PRO'?'PRO':'FREE');
    });
  },[lodge?.id,lodge?.plan,pathname]);

  const goBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
        return;
      }
    } catch {
      // Fallback determinístico abaixo para links abertos diretamente.
    }
    if (fallback) router.replace(fallback as never);
  };

  const backBar = fallback ? (
    <View style={[styles.backBar, desktopManager && styles.desktopBackBar]}>
      <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
        <Feather name="arrow-left" size={18} color={colors.gold} />
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>
    </View>
  ) : null;

  const bodyContent = scroll
    ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={[styles.content, desktopManager && styles.desktopContent, contentStyle]} {...scrollProps}>{children}</ScrollView>
    : <View style={styles.fixedShell}><View style={[styles.content, desktopManager && styles.desktopContent, styles.flex, contentStyle]}>{children}</View></View>;

  const body = <View style={styles.flex}>{backBar}{bodyContent}</View>;

  return <SafeAreaView style={styles.safe} edges={['top']}>{desktopManager ? <View style={styles.desktopShell}><View style={styles.sidebar}><View style={styles.sidebarBrand}><Text style={styles.sidebarEyebrow}>CONNEXIO</Text><Text style={styles.sidebarTitle}>Gestor</Text><Text style={styles.sidebarText}>Sistema Operacional da Loja</Text></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarNav}>{managerRoutes.map((item) => { const locked=item.pro&&!proActive; const active=pathname===item.route; return <Pressable key={item.route} onPress={() => router.push(locked?'/manager-pro':item.route)} style={[styles.navItem,active&&styles.navItemActive,locked&&styles.navItemLocked]}><Feather name={locked?'lock':item.icon} size={17} color={active?colors.gold:colors.textMuted}/><Text style={[styles.navText,active&&styles.navTextActive]}>{item.label}</Text>{locked?<Text style={styles.proBadge}>PRO</Text>:null}</Pressable>; })}</ScrollView><View style={styles.sidebarFooter}><Text style={styles.sidebarFooterText}>{proActive?'Gestor Pro ativo · Android + Web':'Gestor Free · Pro opcional'}</Text></View></View><View style={styles.desktopMain}>{body}</View></View> : body}</SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},scroll:{flex:1},content:{width:'100%',maxWidth:1180,alignSelf:'center',paddingHorizontal:20,paddingBottom:32},desktopContent:{maxWidth:1320,paddingHorizontal:30},fixedShell:{flex:1,width:'100%'},flex:{flex:1},backBar:{width:'100%',maxWidth:1180,alignSelf:'center',paddingHorizontal:20,paddingTop:10,paddingBottom:8},desktopBackBar:{maxWidth:1320,paddingHorizontal:30},backButton:{alignSelf:'flex-start',minHeight:38,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},backPressed:{opacity:.78},backText:{color:colors.cream,fontSize:12,fontWeight:'800'},desktopShell:{flex:1,flexDirection:'row',width:'100%'},desktopMain:{flex:1,minWidth:0},sidebar:{width:248,padding:20,borderRightWidth:1,borderRightColor:colors.border,backgroundColor:colors.surface,gap:18},sidebarBrand:{gap:3,paddingHorizontal:7},sidebarEyebrow:{color:colors.gold,fontSize:9,fontWeight:'900',letterSpacing:1.4},sidebarTitle:{color:colors.cream,fontSize:23,fontWeight:'900'},sidebarText:{color:colors.textMuted,fontSize:10},sidebarNav:{gap:4,paddingBottom:8},navItem:{flexDirection:'row',alignItems:'center',gap:10,minHeight:40,paddingHorizontal:11,borderRadius:12},navItemActive:{backgroundColor:colors.surfaceRaised,borderWidth:1,borderColor:colors.border},navItemLocked:{opacity:.72},navText:{color:colors.textMuted,fontSize:10,fontWeight:'700',flex:1},navTextActive:{color:colors.cream,fontWeight:'900'},proBadge:{color:colors.goldSoft,fontSize:7,fontWeight:'900',borderWidth:1,borderColor:colors.gold,borderRadius:999,paddingHorizontal:5,paddingVertical:2},sidebarFooter:{padding:10,borderRadius:12,backgroundColor:colors.surfaceRaised},sidebarFooterText:{color:colors.textMuted,fontSize:9,lineHeight:14,textAlign:'center'}});
