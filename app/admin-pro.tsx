import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { decideGestorProRequest, loadPendingGestorProRequests } from '@/lib/proPlanRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AdminProScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const reload = () => { void loadPendingGestorProRequests().then(setItems).catch((error)=>Alert.alert('Fila indisponível', error instanceof Error?error.message:'Tente novamente.')); };
  useEffect(reload, []);

  const decide = async (id:string, approve:boolean) => {
    try { await decideGestorProRequest(id, approve, note.trim() || undefined); setNote(''); reload(); Alert.alert(approve?'Gestor Pro ativado':'Solicitação rejeitada', approve?'A Loja já pode usar os módulos Pro.':'A Loja permanece no plano gratuito.'); }
    catch (error) { Alert.alert('Não foi possível decidir', error instanceof Error?error.message:'Tente novamente.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>ADMIN CONNEXIO</Text><Text style={styles.title}>Ativações Gestor Pro</Text><Text style={styles.subtitle}>Fila comercial inicial do plano de R$ 49,90/mês por Loja. Confirme o acordo/pagamento fora do fluxo técnico e então ative a Loja aqui.</Text></View>
    <View style={styles.summary}><Feather name="credit-card" size={20} color={colors.gold}/><Text style={styles.value}>{items.length}</Text><Text style={styles.summaryText}>solicitação(ões) aguardando decisão</Text></View>
    <TextInput value={note} onChangeText={setNote} placeholder="Observação comercial opcional para a próxima decisão" placeholderTextColor={colors.textMuted} style={styles.input}/>
    <View style={styles.list}>{items.map((item)=>{const lodge=Array.isArray(item.lodges)?item.lodges[0]:item.lodges;return <View key={item.id} style={styles.card}><View style={styles.cardHeader}><View style={styles.icon}><Feather name="home" size={19} color={colors.gold}/></View><View style={styles.flex}><Text style={styles.name}>{lodge?.name ?? 'Loja'}</Text><Text style={styles.meta}>{lodge?.number?`nº ${lodge.number} · `:''}{lodge?.orient??''} · {lodge?.region??''}</Text><Text style={styles.meta}>Solicitado em {new Date(item.created_at).toLocaleString('pt-BR')}</Text></View></View><View style={styles.actions}><Button label="Rejeitar" variant="danger" style={styles.action} onPress={()=>void decide(item.id,false)}/><Button label="Ativar Pro" style={styles.action} onPress={()=>void decide(item.id,true)}/></View></View>;})}</View>
    {!items.length?<View style={styles.empty}><Feather name="check-circle" size={26} color={colors.success}/><Text style={styles.emptyText}>Nenhuma ativação Pro pendente.</Text></View>:null}
    <Button label="Voltar ao Admin" variant="secondary" onPress={()=>router.back()}/>
  </Screen>;
}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},summary:{flexDirection:'row',alignItems:'baseline',gap:8,padding:15,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},value:{color:colors.cream,fontSize:24,fontWeight:'900'},summaryText:{color:colors.textMuted,fontSize:10,flex:1},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,color:colors.text,paddingHorizontal:13},list:{gap:10},card:{gap:13,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardHeader:{flexDirection:'row',gap:10,alignItems:'center'},icon:{width:42,height:42,borderRadius:13,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:3},name:{color:colors.text,fontSize:14,fontWeight:'900'},meta:{color:colors.textMuted,fontSize:9},actions:{flexDirection:'row',gap:9},action:{flex:1},empty:{alignItems:'center',gap:7,padding:22},emptyText:{color:colors.textMuted,fontSize:11}});
