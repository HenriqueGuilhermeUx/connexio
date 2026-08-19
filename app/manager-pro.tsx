import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { createGestorProPix } from '@/lib/paymentRepository';
import { loadLatestGestorProRequest, requestGestorPro } from '@/lib/proPlanRepository';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const modules = [
  { icon:'mic' as const,title:'Falar com o Connexio',description:'Execute tarefas de gestão por comando, com confirmação antes de gravar',route:'/manager-voice' as const,featured:true },
  { icon:'activity' as const,title:'Hoje na Loja',description:'Ações geradas por cobranças, prazos, sessões, pessoas e projetos',route:'/manager-today' as const },
  { icon:'pie-chart' as const,title:'Semáforo da Loja',description:'Saúde operacional e indicadores para o Venerável',route:'/manager-health' as const },
  { icon:'heart' as const,title:'Acompanhamento',description:'Proximidade, graus e desenvolvimento de lideranças',route:'/manager-people' as const },
  { icon:'user-plus' as const,title:'Candidatos',description:'Observação, entrevista, sindicância e checklist',route:'/manager-candidates' as const },
  { icon:'book-open' as const,title:'Educação',description:'Trilhas, materiais e progresso de Aprendizes, Companheiros, Mestres e líderes',route:'/manager-education' as const },
  { icon:'folder' as const,title:'Documentos da Loja',description:'Posse, atas, Constituição, Regimento, circulares e arquivos compartilhados',route:'/manager-documents' as const },
  { icon:'send' as const,title:'Publicar para a Loja',description:'Sessões, atas, planejamento, educação e documentos no Mural dos membros',route:'/manager-publish' as const },
  { icon:'target' as const,title:'Planejamento',description:'Objetivos, metas e projetos anuais',route:'/manager-planning' as const },
  { icon:'file-text' as const,title:'Atas inteligentes',description:'Fatos, deliberações e pendências estruturadas',route:'/manager-minutes' as const },
  { icon:'repeat' as const,title:'Transição de gestão',description:'Memória, documentos, acessos, patrimônio e pendências',route:'/manager-transition' as const },
  { icon:'credit-card' as const,title:'Cobranças Pix',description:'Mensalidades e cobranças reais via Woovi da própria Loja',route:'/manager-charges' as const },
  { icon:'dollar-sign' as const,title:'Tesouraria',description:'Contas a pagar e receber, baixas e comprovantes',route:'/manager-finance' as const },
  { icon:'clock' as const,title:'Obrigações',description:'Prazos, recorrências, responsáveis e alertas',route:'/manager-obligations' as const },
] as const;

export default function ManagerProScreen(){
  const{lodge,membership}=useApp();
  const[request,setRequest]=useState<any>(null);
  const[livePlan,setLivePlan]=useState<'FREE'|'PRO'|null>(null);
  const[requesting,setRequesting]=useState(false);
  const[payment,setPayment]=useState<any|null>(null);
  const[feedback,setFeedback]=useState<{type:'success'|'error';text:string}|null>(null);
  const canManage=membership?.role==='WORSHIPFUL_MASTER'||membership?.role==='SECRETARY'||membership?.role==='TREASURER';
  const effectivePlan=livePlan??lodge?.plan??'FREE';
  const proActive=!isSupabaseConfigured||effectivePlan==='PRO';
  const webCheckout=Platform.OS==='web';

  const refresh=async()=>{
    if(!lodge||!isSupabaseConfigured||!supabase)return;
    try{
      const[latest,planResult]=await Promise.all([loadLatestGestorProRequest(lodge.id),supabase.from('lodges').select('plan').eq('id',lodge.id).single()]);
      setRequest(latest);
      if(planResult.error)throw planResult.error;
      setLivePlan(planResult.data?.plan==='PRO'?'PRO':'FREE');
      if(latest?.pix_copy_paste||latest?.payment_link_url)setPayment({brCode:latest.pix_copy_paste,paymentLinkUrl:latest.payment_link_url});
    }catch(error){setFeedback({type:'error',text:`Não foi possível consultar a ativação Pro: ${errorMessage(error)}`});}
  };
  useEffect(()=>{void refresh();},[lodge?.id,lodge?.plan]);

  const askPro=async()=>{
    if(!lodge)return;
    setRequesting(true);setFeedback(null);
    try{
      const row=await requestGestorPro(lodge.id);
      if(!row)throw new Error('A solicitação não retornou confirmação do backend.');
      setRequest(row);
      if(webCheckout){
        const generated=await createGestorProPix(row.id);
        setPayment(generated);
        setFeedback({type:'success',text:'Pix Gestor Pro gerado. Assim que a Woovi confirmar o pagamento, a Loja será ativada automaticamente.'});
      }else{
        setFeedback({type:'success',text:'Solicitação Gestor Pro registrada. A ativação no Android seguirá o fluxo compatível com a Google Play.'});
      }
    }catch(error){setFeedback({type:'error',text:`Não foi possível solicitar o Gestor Pro: ${errorMessage(error)}`});}
    finally{setRequesting(false);}
  };

  const generateExistingPayment=async()=>{
    if(!request?.id)return;
    setRequesting(true);setFeedback(null);
    try{const generated=await createGestorProPix(request.id);setPayment(generated);setFeedback({type:'success',text:'Pix do Gestor Pro gerado.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setRequesting(false);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><View style={styles.brandRow}><View style={styles.crown}><MaterialCommunityIcons name="crown-outline" size={24} color={colors.gold}/></View><View style={styles.brandCopy}><Text style={styles.eyebrow}>CONNEXIO GESTOR PRO</Text><Text style={styles.title}>{lodge?.name??'Sua Loja'}</Text></View></View><Text style={styles.subtitle}>O Sistema Operacional da Loja: pessoas, secretaria, estratégia, conhecimento, documentos e tesouraria numa única rotina.</Text></View>
    <View style={styles.priceCard}><View><Text style={styles.plan}>Gestor Pro</Text><Text style={styles.price}>R$ 49,90<Text style={styles.priceSuffix}> / mês por Loja</Text></Text></View><View style={styles.status}><Text style={styles.statusText}>{proActive?'PRO ATIVO':request?.payment_status==='PENDING'?'AGUARDANDO PIX':request?.status==='PENDING'?'EM ANÁLISE':'FREE'}</Text></View></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    {!proActive?<View style={styles.activation}><Feather name="unlock" size={20} color={colors.gold}/><View style={styles.voiceCopy}><Text style={styles.voiceTitle}>Ative os módulos avançados da Loja</Text><Text style={styles.voiceText}>{webCheckout?'Na Web, o pagamento é por Pix Woovi e a ativação é automática após confirmação.':'No Android distribuído pela Play, a compra de funcionalidades digitais segue as regras de faturamento da Google Play.'}</Text></View><Button label={request?.status==='PENDING'?(webCheckout&&!payment?'Gerar Pix R$49,90':'Solicitação registrada'):(webCheckout?'Assinar por Pix':'Solicitar Gestor Pro')} loading={requesting} disabled={!canManage||(request?.status==='PENDING'&&Boolean(payment))} onPress={()=>void(request?.status==='PENDING'&&webCheckout&&!payment?generateExistingPayment():askPro())} style={styles.activateButton}/></View>:null}

    {!proActive&&webCheckout&&payment?<View style={styles.paymentCard}><View style={styles.paymentHeader}><Feather name="grid" size={20} color={colors.gold}/><View style={styles.voiceCopy}><Text style={styles.paymentTitle}>Pague R$49,90 por Pix</Text><Text style={styles.voiceText}>A confirmação da Woovi libera o plano Pro automaticamente.</Text></View></View>{payment.qrCodeImage?<Image source={{uri:payment.qrCodeImage}} style={styles.qr}/>:null}{payment.brCode?<View style={styles.codeBox}><Text style={styles.codeLabel}>Pix copia e cola</Text><Text selectable style={styles.code}>{payment.brCode}</Text></View>:null}{payment.paymentLinkUrl?<Button label="Abrir pagamento Woovi" variant="secondary" onPress={()=>void Linking.openURL(payment.paymentLinkUrl)}/>:null}</View>:null}

    {proActive?<Pressable onPress={()=>router.push('/manager-voice')} style={({pressed})=>[styles.voiceHero,pressed&&styles.pressed]}><View style={styles.voiceHeroIcon}><Feather name="mic" size={30} color={colors.background}/></View><View style={styles.voiceCopy}><Text style={styles.voiceHeroEyebrow}>GESTÃO POR VOZ</Text><Text style={styles.voiceHeroTitle}>Fale. Confira. Confirme.</Text><Text style={styles.voiceHeroText}>“Crie uma obrigação para renovar o certificado dia 30.” · “Gere a mensalidade dos irmãos.” · “Publique o comunicado da sessão.”</Text></View><Feather name="arrow-right" size={22} color={colors.gold}/></Pressable>:null}

    <View style={styles.grid}>{modules.map((module)=><Pressable key={module.title} disabled={!canManage||!proActive} onPress={()=>router.push(module.route)} style={({pressed})=>[styles.moduleCard,module.featured&&styles.moduleFeatured,(!canManage||!proActive)&&styles.disabled,pressed&&styles.pressed]}><View style={styles.moduleIcon}><Feather name={module.icon} size={21} color={colors.gold}/></View><Text style={styles.moduleTitle}>{module.title}</Text><Text style={styles.moduleDescription}>{module.description}</Text><Text style={styles.open}>{proActive?'Abrir →':'Pro'}</Text></Pressable>)}</View>
    <View style={styles.note}><Feather name="shield" size={17} color={colors.gold}/><Text style={styles.noteText}>Dados financeiros, candidatos, notas de acompanhamento, documentos e transição são protegidos por permissões de gestão no backend.</Text></View>
  </Screen>;
}

function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:20},header:{gap:10},brandRow:{flexDirection:'row',alignItems:'center',gap:12},crown:{width:48,height:48,borderRadius:15,backgroundColor:'rgba(209,174,87,0.12)',alignItems:'center',justifyContent:'center'},brandCopy:{flex:1,gap:3},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:24,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},priceCard:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,padding:17,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},plan:{color:colors.text,fontSize:13,fontWeight:'800'},price:{color:colors.cream,fontSize:22,fontWeight:'900',marginTop:2},priceSuffix:{color:colors.textMuted,fontSize:10,fontWeight:'600'},status:{borderRadius:999,borderWidth:1,borderColor:colors.gold,paddingHorizontal:9,paddingVertical:6},statusText:{color:colors.goldSoft,fontSize:8,fontWeight:'900',letterSpacing:.7},feedback:{flexDirection:'row',gap:9,alignItems:'flex-start',padding:13,borderRadius:14,borderWidth:1},feedbackError:{backgroundColor:'rgba(245,141,141,0.08)',borderColor:colors.danger},feedbackSuccess:{backgroundColor:'rgba(109,207,151,0.08)',borderColor:colors.success},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},activation:{flexDirection:'row',alignItems:'center',gap:11,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold,flexWrap:'wrap'},activateButton:{minHeight:42},paymentCard:{gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},paymentHeader:{flexDirection:'row',alignItems:'center',gap:10},paymentTitle:{color:colors.cream,fontSize:15,fontWeight:'900'},qr:{width:220,height:220,alignSelf:'center',borderRadius:12,backgroundColor:'#fff'},codeBox:{gap:5,padding:11,borderRadius:12,backgroundColor:colors.surfaceRaised},codeLabel:{color:colors.gold,fontSize:9,fontWeight:'900'},code:{color:colors.text,fontSize:9,lineHeight:14},voiceHero:{flexDirection:'row',alignItems:'center',gap:14,padding:18,borderRadius:20,backgroundColor:'rgba(209,174,87,.10)',borderWidth:1,borderColor:colors.gold},voiceHeroIcon:{width:58,height:58,borderRadius:18,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},voiceHeroEyebrow:{color:colors.gold,fontSize:8,fontWeight:'900',letterSpacing:1},voiceHeroTitle:{color:colors.cream,fontSize:18,fontWeight:'900'},voiceHeroText:{color:colors.textMuted,fontSize:10,lineHeight:15},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},moduleCard:{width:'31%',minWidth:230,flexGrow:1,minHeight:165,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:8},moduleFeatured:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.05)'},moduleIcon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},moduleTitle:{color:colors.text,fontSize:14,fontWeight:'900'},moduleDescription:{color:colors.textMuted,fontSize:10,lineHeight:15},open:{color:colors.goldSoft,fontSize:10,fontWeight:'900',marginTop:'auto'},disabled:{opacity:.42},pressed:{opacity:.8},voiceCopy:{flex:1,gap:3},voiceTitle:{color:colors.text,fontSize:13,fontWeight:'900'},voiceText:{color:colors.textMuted,fontSize:10,lineHeight:16},note:{flexDirection:'row',gap:9,alignItems:'center',padding:12,borderRadius:14,backgroundColor:colors.surfaceRaised},noteText:{flex:1,color:colors.textMuted,fontSize:10,lineHeight:15}});
