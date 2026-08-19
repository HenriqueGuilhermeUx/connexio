import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { loadLatestGestorProRequest, requestGestorPro } from '@/lib/proPlanRepository';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const modules = [
  { icon:'activity' as const,title:'Hoje na Loja',description:'Ações geradas por cobranças, prazos, sessões, pessoas e projetos',route:'/manager-today' as const },
  { icon:'pie-chart' as const,title:'Semáforo da Loja',description:'Saúde operacional e indicadores para o Venerável',route:'/manager-health' as const },
  { icon:'heart' as const,title:'Acompanhamento',description:'Proximidade, graus e desenvolvimento de lideranças',route:'/manager-people' as const },
  { icon:'user-plus' as const,title:'Candidatos',description:'Observação, entrevista, sindicância e checklist',route:'/manager-candidates' as const },
  { icon:'book-open' as const,title:'Educação',description:'Trilhas para Aprendizes, Companheiros, Mestres e líderes',route:'/manager-education' as const },
  { icon:'target' as const,title:'Planejamento',description:'Objetivos, metas e projetos anuais',route:'/manager-planning' as const },
  { icon:'file-text' as const,title:'Atas inteligentes',description:'Fatos, deliberações e pendências estruturadas',route:'/manager-minutes' as const },
  { icon:'repeat' as const,title:'Transição de gestão',description:'Memória, documentos, acessos, patrimônio e pendências',route:'/manager-transition' as const },
  { icon:'credit-card' as const,title:'Cobranças',description:'Mensalidades e cobranças da Loja',route:'/manager-charges' as const },
  { icon:'dollar-sign' as const,title:'Tesouraria',description:'Contas a pagar e receber, baixas e comprovantes',route:'/manager-finance' as const },
  { icon:'clock' as const,title:'Obrigações',description:'Prazos, recorrências, responsáveis e alertas',route:'/manager-obligations' as const },
];

export default function ManagerProScreen(){
  const{lodge,membership}=useApp();
  const[request,setRequest]=useState<any>(null);
  const[requesting,setRequesting]=useState(false);
  const[feedback,setFeedback]=useState<{type:'success'|'error';text:string}|null>(null);
  const canManage=membership?.role==='WORSHIPFUL_MASTER'||membership?.role==='SECRETARY'||membership?.role==='TREASURER';
  const proActive=!isSupabaseConfigured||lodge?.plan==='PRO';

  useEffect(()=>{
    if(!lodge||!isSupabaseConfigured)return;
    void loadLatestGestorProRequest(lodge.id)
      .then(setRequest)
      .catch((error)=>setFeedback({type:'error',text:`Não foi possível consultar a ativação Pro: ${error instanceof Error?error.message:'Tente novamente.'}`}));
  },[lodge?.id,lodge?.plan]);

  const askPro=async()=>{
    if(!lodge)return;
    setRequesting(true);
    setFeedback(null);
    try{
      const row=await requestGestorPro(lodge.id);
      if(!row) throw new Error('A solicitação não retornou confirmação do backend.');
      setRequest(row);
      setFeedback({type:'success',text:'Solicitação Gestor Pro enviada. Ela já está na fila do Admin Connexio para ativação do plano de R$ 49,90/mês por Loja.'});
    }catch(error){
      setFeedback({type:'error',text:`Não foi possível solicitar o Gestor Pro: ${error instanceof Error?error.message:'Tente novamente.'}`});
    }finally{
      setRequesting(false);
    }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><View style={styles.brandRow}><View style={styles.crown}><MaterialCommunityIcons name="crown-outline" size={24} color={colors.gold}/></View><View style={styles.brandCopy}><Text style={styles.eyebrow}>CONNEXIO GESTOR PRO</Text><Text style={styles.title}>{lodge?.name??'Sua Loja'}</Text></View></View><Text style={styles.subtitle}>O Sistema Operacional da Loja: pessoas, secretaria, estratégia e tesouraria numa única rotina.</Text></View>
    <View style={styles.priceCard}><View><Text style={styles.plan}>Gestor Pro</Text><Text style={styles.price}>R$ 49,90<Text style={styles.priceSuffix}> / mês por Loja</Text></Text></View><View style={styles.status}><Text style={styles.statusText}>{proActive?'PRO ATIVO':request?.status==='PENDING'?'EM ANÁLISE':'FREE'}</Text></View></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}
    {!proActive?<View style={styles.activation}><Feather name="unlock" size={20} color={colors.gold}/><View style={styles.voiceCopy}><Text style={styles.voiceTitle}>Ative os módulos avançados da Loja</Text><Text style={styles.voiceText}>A gestão comum continua gratuita. O Pro concentra automação, acompanhamento, planejamento, candidatos, educação, atas, tesouraria, cobranças e continuidade administrativa.</Text></View><Button label={request?.status==='PENDING'?'Solicitação enviada':'Solicitar Gestor Pro'} loading={requesting} disabled={!canManage||request?.status==='PENDING'} onPress={()=>void askPro()} style={styles.activateButton}/></View>:null}
    <View style={styles.grid}>{modules.map((module)=><Pressable key={module.title} disabled={!canManage||!proActive} onPress={()=>router.push(module.route)} style={({pressed})=>[styles.moduleCard,(!canManage||!proActive)&&styles.disabled,pressed&&styles.pressed]}><View style={styles.moduleIcon}><Feather name={module.icon} size={21} color={colors.gold}/></View><Text style={styles.moduleTitle}>{module.title}</Text><Text style={styles.moduleDescription}>{module.description}</Text><Text style={styles.open}>{proActive?'Abrir →':'Pro'}</Text></Pressable>)}</View>
    <View style={styles.voiceCard}><View style={styles.voiceIcon}><Feather name="mic" size={22} color={colors.gold}/></View><View style={styles.voiceCopy}><Text style={styles.voiceTitle}>Pronto para o motor de voz do Staff</Text><Text style={styles.voiceText}>As ações do Pro foram separadas em operações estruturadas para depois receber comandos como criar conta, obrigação, tarefa e consulta do Hoje na Loja com confirmação antes de gravar.</Text></View></View>
    <View style={styles.note}><Feather name="shield" size={17} color={colors.gold}/><Text style={styles.noteText}>Dados financeiros, candidatos, notas de acompanhamento e transição são protegidos por permissões de gestão no backend.</Text></View>
    <Button label="Voltar ao Gestor" variant="secondary" onPress={()=>router.back()}/>
  </Screen>;
}

const styles=StyleSheet.create({content:{paddingTop:22,gap:20},header:{gap:10},brandRow:{flexDirection:'row',alignItems:'center',gap:12},crown:{width:48,height:48,borderRadius:15,backgroundColor:'rgba(209,174,87,0.12)',alignItems:'center',justifyContent:'center'},brandCopy:{flex:1,gap:3},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:24,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},priceCard:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,padding:17,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},plan:{color:colors.text,fontSize:13,fontWeight:'800'},price:{color:colors.cream,fontSize:22,fontWeight:'900',marginTop:2},priceSuffix:{color:colors.textMuted,fontSize:10,fontWeight:'600'},status:{borderRadius:999,borderWidth:1,borderColor:colors.gold,paddingHorizontal:9,paddingVertical:6},statusText:{color:colors.goldSoft,fontSize:8,fontWeight:'900',letterSpacing:.7},feedback:{flexDirection:'row',gap:9,alignItems:'flex-start',padding:13,borderRadius:14,borderWidth:1},feedbackError:{backgroundColor:'rgba(245,141,141,0.08)',borderColor:colors.danger},feedbackSuccess:{backgroundColor:'rgba(109,207,151,0.08)',borderColor:colors.success},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},activation:{flexDirection:'row',alignItems:'center',gap:11,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},activateButton:{minHeight:42},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},moduleCard:{width:'31%',minWidth:230,flexGrow:1,minHeight:165,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:8},moduleIcon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},moduleTitle:{color:colors.text,fontSize:14,fontWeight:'900'},moduleDescription:{color:colors.textMuted,fontSize:10,lineHeight:15},open:{color:colors.goldSoft,fontSize:10,fontWeight:'900',marginTop:'auto'},disabled:{opacity:.42},pressed:{opacity:.8},voiceCard:{flexDirection:'row',gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},voiceIcon:{width:44,height:44,borderRadius:14,backgroundColor:'rgba(209,174,87,0.10)',alignItems:'center',justifyContent:'center'},voiceCopy:{flex:1,gap:3},voiceTitle:{color:colors.text,fontSize:13,fontWeight:'900'},voiceText:{color:colors.textMuted,fontSize:10,lineHeight:16},note:{flexDirection:'row',gap:9,alignItems:'center',padding:12,borderRadius:14,backgroundColor:colors.surfaceRaised},noteText:{flex:1,color:colors.textMuted,fontSize:10,lineHeight:15}});
