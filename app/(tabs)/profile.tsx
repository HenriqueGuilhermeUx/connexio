import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { member, listings, lodge, membership, logout } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const ownListings = listings.filter((listing) => listing.ownerId === member?.id);
  const canManage = membership?.role === 'WORSHIPFUL_MASTER' || membership?.role === 'SECRETARY' || membership?.role === 'TREASURER';
  useEffect(() => { if (!supabase || !member) { setIsAdmin(false); return; } void supabase.rpc('is_connexio_admin').then(({ data, error }) => { if (!error) setIsAdmin(Boolean(data)); }); }, [member?.id]);
  const leave = () => { logout(); router.replace('/welcome'); };

  return <Screen contentStyle={styles.content}>
    <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{member?.name[0] ?? 'C'}</Text></View><View style={styles.profileCopy}><View style={styles.nameRow}><Text style={styles.name}>{member?.name ?? 'Membro Connexio'}</Text><MaterialCommunityIcons name="check-decagram" size={19} color={colors.gold}/></View><Text style={styles.lodge}>{member?.lodge}</Text><View style={styles.verifiedPill}><Text style={styles.verifiedText}>MEMBRO VERIFICADO</Text></View></View></View>
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{ownListings.length}</Text><Text style={styles.statLabel}>Anúncios</Text></View><View style={styles.statDivider}/><View style={styles.stat}><Text style={styles.statValue}>{member?.city ?? '—'}</Text><Text style={styles.statLabel}>Cidade</Text></View></View>
    {member?.status==='APPROVED'&&lodge&&membership?<View style={styles.section}><Text style={styles.sectionTitle}>Identidade</Text><Button label="Abrir carteirinha digital" onPress={()=>router.push('/member-card')}/><Text style={styles.helper}>QR verificável, revogável e sem expor dados pessoais sensíveis.</Text></View>:null}
    {canManage?<View style={styles.section}><Text style={styles.sectionTitle}>Minha Loja</Text><Button label="Abrir Connexio Gestor" variant="secondary" onPress={()=>router.push('/manager')}/><Text style={styles.helper}>Gestor Free para rotina da comunidade e Gestor Pro para operação, estratégia, pessoas e tesouraria.</Text></View>:null}
    <View style={styles.section}><Text style={styles.sectionTitle}>Dados validados</Text><View style={styles.infoCard}><InfoRow icon="mail" label="E-mail" value={member?.email??''}/><InfoRow icon="phone" label="WhatsApp" value={member?.whatsapp??''}/><InfoRow icon="shield" label="CIM" value={member?.cimMasked??''}/><InfoRow icon="map-pin" label="Região" value={member?.region??''}/></View></View>
    {isAdmin?<View style={styles.section}><Text style={styles.sectionTitle}>Admin Connexio</Text><Button label="Membros e gestores" variant="secondary" onPress={()=>router.push('/admin')}/><Button label="Ativações Gestor Pro" variant="secondary" onPress={()=>router.push('/admin-pro')}/><Text style={styles.adminNote}>Acesso administrativo separado das permissões de cada Loja.</Text></View>:null}
    <Button label="Sair da conta" variant="danger" onPress={leave}/>
  </Screen>;
}
function InfoRow({icon,label,value}:{icon:keyof typeof Feather.glyphMap;label:string;value:string}){return <View style={styles.infoRow}><View style={styles.infoIcon}><Feather name={icon} size={17} color={colors.gold}/></View><View style={styles.infoCopy}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;}
const styles=StyleSheet.create({content:{paddingTop:22,gap:25},profileCard:{flexDirection:'row',alignItems:'center',gap:15},avatar:{width:70,height:70,borderRadius:23,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},avatarText:{color:colors.background,fontSize:28,fontWeight:'900'},profileCopy:{flex:1,gap:5},nameRow:{flexDirection:'row',alignItems:'center',gap:7},name:{color:colors.cream,fontSize:22,fontWeight:'800',flexShrink:1},lodge:{color:colors.textMuted,fontSize:12},verifiedPill:{alignSelf:'flex-start',marginTop:3,backgroundColor:'rgba(209,174,87,0.12)',borderRadius:999,borderWidth:1,borderColor:colors.gold,paddingHorizontal:9,paddingVertical:5},verifiedText:{color:colors.goldSoft,fontSize:9,fontWeight:'900',letterSpacing:.8},stats:{flexDirection:'row',backgroundColor:colors.surface,borderRadius:18,borderWidth:1,borderColor:colors.border,padding:17},stat:{flex:1,alignItems:'center',gap:4},statValue:{color:colors.text,fontSize:17,fontWeight:'800'},statLabel:{color:colors.textMuted,fontSize:11},statDivider:{width:1,backgroundColor:colors.border},section:{gap:12},sectionTitle:{color:colors.text,fontSize:17,fontWeight:'800'},helper:{color:colors.textMuted,fontSize:11,lineHeight:16,textAlign:'center'},infoCard:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:18,overflow:'hidden'},infoRow:{flexDirection:'row',alignItems:'center',gap:12,padding:15,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:colors.border},infoIcon:{width:36,height:36,borderRadius:11,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},infoCopy:{flex:1,gap:2},infoLabel:{color:colors.textMuted,fontSize:11},infoValue:{color:colors.text,fontSize:13,fontWeight:'600'},adminNote:{color:colors.textMuted,fontSize:11,lineHeight:16,textAlign:'center'}});
