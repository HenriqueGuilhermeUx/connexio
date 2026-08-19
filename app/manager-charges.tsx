import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import {
  configureLodgeWoovi,
  createLodgeCharge,
  createLodgeChargePix,
  isLodgeWooviConfigured,
  loadLodgeCharges,
} from '@/lib/paymentRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Feedback = { type:'success'|'error'; text:string } | null;

export default function ManagerChargesScreen() {
  const { lodge, lodgeMembers } = useApp();
  const [charges,setCharges]=useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState(lodgeMembers[0]?.id ?? '');
  const [description, setDescription] = useState('Mensalidade');
  const [amount, setAmount] = useState('150');
  const [dueDate, setDueDate] = useState('');
  const [wooviConfigured,setWooviConfigured]=useState(false);
  const [wooviAppId,setWooviAppId]=useState('');
  const [busy,setBusy]=useState<string|null>(null);
  const [feedback,setFeedback]=useState<Feedback>(null);
  const [pix,setPix]=useState<any|null>(null);

  const selectedMember = lodgeMembers.find((item) => item.id === selectedMemberId);

  const reload=async()=>{
    if(!lodge)return;
    try{
      const [loaded,configured]=await Promise.all([loadLodgeCharges(lodge.id),isLodgeWooviConfigured(lodge.id)]);
      setCharges(loaded);setWooviConfigured(configured);
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}
  };
  useEffect(()=>{void reload();},[lodge?.id]);

  const saveWoovi=async()=>{
    if(!lodge||!wooviAppId.trim()){setFeedback({type:'error',text:'Cole o AppID da conta Woovi da Loja.'});return;}
    setBusy('woovi');setFeedback(null);
    try{await configureLodgeWoovi(lodge.id,wooviAppId.trim());setWooviAppId('');setWooviConfigured(true);setFeedback({type:'success',text:'Conta Woovi da Loja configurada. O AppID fica restrito ao backend e não é exibido novamente.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const originate=async()=>{
    const numericAmount=Number(amount.replace(',','.'));
    if(!lodge||!selectedMember||!description.trim()||!dueDate.trim()||!numericAmount){setFeedback({type:'error',text:'Selecione o membro e informe descrição, valor e vencimento.'});return;}
    if(!wooviConfigured){setFeedback({type:'error',text:'Configure primeiro a conta Woovi da Loja para gerar o Pix diretamente para ela.'});return;}
    setBusy('create');setFeedback(null);setPix(null);
    try{
      const chargeId=await createLodgeCharge({lodgeId:lodge.id,memberId:selectedMember.id,memberName:selectedMember.name,memberEmail:selectedMember.email,memberPhone:selectedMember.whatsapp,description:description.trim(),amount:numericAmount,dueDate:dueDate.trim()});
      const generated=await createLodgeChargePix(chargeId);
      setPix(generated);
      await reload();
      setFeedback({type:'success',text:'Cobrança Pix criada na Woovi. O webhook fará a baixa automática quando o pagamento for confirmado.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const regenerate=async(charge:any)=>{
    setBusy(charge.id);setFeedback(null);setPix(null);
    try{const generated=await createLodgeChargePix(charge.id);setPix(generated);await reload();setFeedback({type:'success',text:`Pix disponível para ${charge.member_name}.`});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · WOOVI</Text><Text style={styles.title}>Cobranças Pix</Text><Text style={styles.subtitle}>Gere mensalidades e outras cobranças para os membros. O Pix é criado na conta Woovi da própria Loja e a baixa é conciliada automaticamente por webhook.</Text></View>

    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={[styles.providerNotice,wooviConfigured&&styles.providerOk]}><Feather name={wooviConfigured?'check-circle':'zap'} size={19} color={wooviConfigured?colors.success:colors.gold}/><View style={styles.providerCopy}><Text style={styles.providerTitle}>{wooviConfigured?'Woovi da Loja conectada':'Conecte a Woovi da Loja'}</Text><Text style={styles.providerText}>{wooviConfigured?'Novas cobranças podem gerar QR Code, Pix copia e cola e link de pagamento.':'Use o AppID da conta Woovi pertencente à Loja. Assim as mensalidades não passam pela conta do Connexio.'}</Text></View></View>
    {!wooviConfigured?<View style={styles.formCard}><Text style={styles.label}>AppID Woovi da Loja</Text><TextInput value={wooviAppId} onChangeText={setWooviAppId} secureTextEntry placeholder="Cole o AppID da aplicação Woovi" placeholderTextColor={colors.textMuted} style={styles.input}/><Button label="Conectar Woovi" loading={busy==='woovi'} onPress={()=>void saveWoovi()}/></View>:null}

    <View style={styles.formCard}>
      <Text style={styles.label}>Membro</Text>
      <View style={styles.memberList}>{lodgeMembers.map((item) => <Pressable key={item.id} onPress={() => setSelectedMemberId(item.id)} style={[styles.memberChip, selectedMemberId === item.id && styles.memberChipActive]}><Text style={[styles.memberChipText, selectedMemberId === item.id && styles.memberChipTextActive]}>{item.name}</Text></Pressable>)}</View>
      {!lodgeMembers.length?<Text style={styles.empty}>Cadastre membros na Loja para poder originar cobranças individuais.</Text>:null}
      <TextInput value={description} onChangeText={setDescription} placeholder="Descrição" placeholderTextColor={colors.textMuted} style={styles.input} />
      <View style={styles.row}><TextInput value={amount} onChangeText={setAmount} placeholder="Valor" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /><TextInput value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /></View>
      <Button label="Gerar cobrança Pix" loading={busy==='create'} disabled={!wooviConfigured||!lodgeMembers.length} onPress={()=>void originate()} />
    </View>

    {pix?<View style={styles.pixCard}><View style={styles.pixHeader}><Feather name="grid" size={20} color={colors.gold}/><Text style={styles.pixTitle}>Pix pronto para pagamento</Text></View>{pix.qrCodeImage?<Image source={{uri:pix.qrCodeImage}} style={styles.qr}/>:null}{pix.brCode?<View style={styles.codeBox}><Text style={styles.codeLabel}>Pix copia e cola</Text><Text selectable style={styles.code}>{pix.brCode}</Text></View>:null}{pix.paymentLinkUrl?<Button label="Abrir página de pagamento" variant="secondary" onPress={()=>void Linking.openURL(pix.paymentLinkUrl)}/>:null}</View>:null}

    <View style={styles.section}><Text style={styles.sectionTitle}>Cobranças recentes</Text>{charges.map((charge:any)=><View key={charge.id} style={styles.chargeCard}><View style={styles.chargeIcon}><Feather name={charge.status==='PAID'?'check':'credit-card'} size={18} color={charge.status==='PAID'?colors.success:colors.gold}/></View><View style={styles.chargeCopy}><Text style={styles.chargeName}>{charge.member_name}</Text><Text style={styles.chargeMeta}>{charge.description} · vence {new Date(`${charge.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</Text>{charge.provider==='WOOVI'?<Text style={styles.woovi}>WOOVI · PIX</Text>:null}</View><View style={styles.chargeRight}><Text style={styles.chargeValue}>{charge.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Text><Text style={[styles.chargeStatus,charge.status==='PAID'&&styles.paid]}>{statusLabel(charge.status)}</Text>{charge.status!=='PAID'?<Pressable disabled={busy!==null} onPress={()=>void regenerate(charge)}><Text style={styles.pixLink}>{charge.pix_copy_paste?'Ver Pix':'Gerar Pix'}</Text></Pressable>:null}</View></View>)}{!charges.length?<Text style={styles.empty}>Nenhuma cobrança criada ainda.</Text>:null}</View>

    <View style={styles.bulkCard}><Feather name="mic" size={20} color={colors.gold}/><View style={styles.bulkCopy}><Text style={styles.bulkTitle}>Cobrança em lote por voz</Text><Text style={styles.bulkText}>A arquitetura já está preparada para comandos como “gere a mensalidade de R$150 para todos os membros com vencimento dia 10”. A entrada de voz ganhará uma central própria no Gestor Pro.</Text></View></View>
  </Screen>;
}

function statusLabel(status:string){if(status==='PAID')return'Pago';if(status==='EXPIRED')return'Vencido';if(status==='CANCELED'||status==='CANCELLED')return'Cancelado';return'Pendente';}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:20},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:26,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},providerNotice:{flexDirection:'row',gap:11,padding:14,borderRadius:15,backgroundColor:'rgba(209,174,87,0.08)',borderWidth:1,borderColor:colors.gold},providerOk:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.06)'},providerCopy:{flex:1,gap:3},providerTitle:{color:colors.goldSoft,fontSize:12,fontWeight:'900'},providerText:{color:colors.textMuted,fontSize:10,lineHeight:16},formCard:{gap:12,padding:16,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},label:{color:colors.text,fontSize:12,fontWeight:'800'},memberList:{flexDirection:'row',flexWrap:'wrap',gap:8},memberChip:{borderRadius:999,paddingHorizontal:11,paddingVertical:8,borderWidth:1,borderColor:colors.border},memberChipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,0.10)'},memberChipText:{color:colors.textMuted,fontSize:10,fontWeight:'700'},memberChipTextActive:{color:colors.goldSoft},input:{minHeight:50,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:14,fontSize:13},row:{flexDirection:'row',gap:10},flex:{flex:1},pixCard:{gap:12,padding:16,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},pixHeader:{flexDirection:'row',alignItems:'center',gap:9},pixTitle:{color:colors.cream,fontSize:15,fontWeight:'900'},qr:{width:220,height:220,alignSelf:'center',borderRadius:12,backgroundColor:'#fff'},codeBox:{gap:5,padding:11,borderRadius:12,backgroundColor:colors.surfaceRaised},codeLabel:{color:colors.gold,fontSize:9,fontWeight:'900'},code:{color:colors.text,fontSize:9,lineHeight:14},section:{gap:10},sectionTitle:{color:colors.text,fontSize:17,fontWeight:'900'},chargeCard:{flexDirection:'row',alignItems:'center',gap:11,padding:13,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},chargeIcon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},chargeCopy:{flex:1,gap:2},chargeName:{color:colors.text,fontSize:13,fontWeight:'800'},chargeMeta:{color:colors.textMuted,fontSize:10},woovi:{color:colors.gold,fontSize:7,fontWeight:'900'},chargeRight:{alignItems:'flex-end',gap:2},chargeValue:{color:colors.cream,fontSize:12,fontWeight:'900'},chargeStatus:{color:colors.goldSoft,fontSize:9,fontWeight:'800'},paid:{color:colors.success},pixLink:{color:colors.gold,fontSize:9,fontWeight:'900',marginTop:4},empty:{color:colors.textMuted,fontSize:10,textAlign:'center',paddingVertical:10},bulkCard:{flexDirection:'row',gap:11,alignItems:'center',padding:14,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},bulkCopy:{flex:1,gap:3},bulkTitle:{color:colors.text,fontSize:12,fontWeight:'900'},bulkText:{color:colors.textMuted,fontSize:10,lineHeight:15}});
