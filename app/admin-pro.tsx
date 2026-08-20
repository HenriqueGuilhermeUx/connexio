import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { decideGestorProRequest, loadPendingGestorProRequests } from '@/lib/proPlanRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const candidate = error as { message?: unknown; details?: unknown; code?: unknown };
    const parts = [candidate.message, candidate.details, candidate.code ? `código ${candidate.code}` : null]
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    if (parts.length) return parts.join(' — ');
  }
  return 'Tente novamente.';
}

export default function AdminProScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type:'success'|'error';text:string}|null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await loadPendingGestorProRequests());
      setFeedback((current) => current?.type === 'success' ? current : null);
    } catch (error) {
      setFeedback({type:'error',text:`Fila indisponível: ${describeError(error)}`});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const decide = async (id:string, approve:boolean) => {
    setDecidingId(id);
    setFeedback(null);
    try {
      await decideGestorProRequest(id, approve, note.trim() || undefined);
      setNote('');
      await reload();
      setFeedback({type:'success',text:approve?'Gestor Pro ativado. A Loja já pode usar os módulos Pro.':'Solicitação rejeitada. A Loja permanece no plano gratuito.'});
    } catch (error) {
      setFeedback({type:'error',text:`Não foi possível decidir: ${describeError(error)}`});
    } finally {
      setDecidingId(null);
    }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>ADMIN CONNEXIO</Text><Text style={styles.title}>Ativações Gestor Pro</Text><Text style={styles.subtitle}>Fila comercial inicial do plano de R$ 49,90/mês por Loja. Confirme o acordo/pagamento fora do fluxo técnico e então ative a Loja aqui.</Text></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}
    <View style={styles.summary}><Feather name="credit-card" size={20} color={colors.gold}/><Text style={styles.value}>{loading?'…':items.length}</Text><Text style={styles.summaryText}>solicitação(ões) aguardando decisão</Text></View>
    <TextInput value={note} onChangeText={setNote} placeholder="Observação comercial opcional para a próxima decisão" placeholderTextColor={colors.textMuted} style={styles.input}/>
    <View style={styles.list}>{items.map((item)=>{const lodge=Array.isArray(item.lodges)?item.lodges[0]:item.lodges;return <View key={item.id} style={styles.card}><View style={styles.cardHeader}><View style={styles.icon}><Feather name="home" size={19} color={colors.gold}/></View><View style={styles.flex}><Text style={styles.name}>{lodge?.name ?? 'Loja'}</Text><Text style={styles.meta}>{lodge?.number?`nº ${lodge.number} · `:''}{lodge?.orient??''} · {lodge?.region??''}</Text><Text style={styles.meta}>Solicitado em {new Date(item.created_at).toLocaleString('pt-BR')}</Text></View></View><View style={styles.actions}><Button label="Rejeitar" variant="danger" style={styles.action} loading={decidingId===item.id} disabled={decidingId!==null} onPress={()=>void decide(item.id,false)}/><Button label="Ativar Pro" style={styles.action} loading={decidingId===item.id} disabled={decidingId!==null} onPress={()=>void decide(item.id,true)}/></View></View>;})}</View>
    {!items.length&&!loading?<View style={styles.empty}><Feather name="check-circle" size={26} color={colors.success}/><Text style={styles.emptyText}>Nenhuma ativação Pro pendente.</Text></View>:null}
    <Button label="Voltar ao Admin" variant="secondary" onPress={()=>router.back()}/>
  </Screen>;
}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,alignItems:'flex-start',padding:13,borderRadius:14,borderWidth:1},feedbackError:{backgroundColor:'rgba(245,141,141,0.08)',borderColor:colors.danger},feedbackSuccess:{backgroundColor:'rgba(109,207,151,0.08)',borderColor:colors.success},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},summary:{flexDirection:'row',alignItems:'baseline',gap:8,padding:15,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},value:{color:colors.cream,fontSize:24,fontWeight:'900'},summaryText:{color:colors.textMuted,fontSize:10,flex:1},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,color:colors.text,paddingHorizontal:13},list:{gap:10},card:{gap:13,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardHeader:{flexDirection:'row',gap:10,alignItems:'center'},icon:{width:42,height:42,borderRadius:13,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:3},name:{color:colors.text,fontSize:14,fontWeight:'900'},meta:{color:colors.textMuted,fontSize:9},actions:{flexDirection:'row',gap:9},action:{flex:1},empty:{alignItems:'center',gap:7,padding:22},emptyText:{color:colors.textMuted,fontSize:11}});
