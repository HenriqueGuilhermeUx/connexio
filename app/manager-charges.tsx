import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import {
  createLodgeCharge,
  getLodgePixQrUrl,
  loadLodgeCharges,
  loadLodgePaymentProfile,
  markLodgeChargePaid,
  saveLodgePaymentProfile,
  uploadLodgePixQr,
  LodgePaymentProfile,
} from '@/lib/paymentRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Feedback = { type:'success'|'error'; text:string } | null;
const keyTypes: LodgePaymentProfile['pix_key_type'][] = ['CNPJ','CPF','EMAIL','PHONE','RANDOM','OTHER'];

export default function ManagerChargesScreen() {
  const { lodge, lodgeMembers } = useApp();
  const [charges,setCharges]=useState<any[]>([]);
  const [profile,setProfile]=useState<LodgePaymentProfile|null>(null);
  const [selectedMemberId,setSelectedMemberId]=useState(lodgeMembers[0]?.id??'');
  const [description,setDescription]=useState('Mensalidade');
  const [amount,setAmount]=useState('150');
  const [dueDate,setDueDate]=useState('');
  const [pixKeyType,setPixKeyType]=useState<LodgePaymentProfile['pix_key_type']>('CNPJ');
  const [pixKey,setPixKey]=useState('');
  const [beneficiary,setBeneficiary]=useState('');
  const [bankName,setBankName]=useState('');
  const [instructions,setInstructions]=useState('');
  const [qrPath,setQrPath]=useState<string|null>(null);
  const [qrUrl,setQrUrl]=useState<string|null>(null);
  const [busy,setBusy]=useState<string|null>(null);
  const [feedback,setFeedback]=useState<Feedback>(null);

  const selectedMember=lodgeMembers.find((item)=>item.id===selectedMemberId);

  const reload=async()=>{
    if(!lodge)return;
    try{
      const [loaded,paymentProfile]=await Promise.all([loadLodgeCharges(lodge.id),loadLodgePaymentProfile(lodge.id)]);
      setCharges(loaded);setProfile(paymentProfile);
      if(paymentProfile){
        setPixKeyType(paymentProfile.pix_key_type);setPixKey(paymentProfile.pix_key);setBeneficiary(paymentProfile.beneficiary_name);
        setBankName(paymentProfile.bank_name??'');setInstructions(paymentProfile.instructions??'');setQrPath(paymentProfile.qr_storage_path??null);
        if(paymentProfile.qr_storage_path)setQrUrl(await getLodgePixQrUrl(paymentProfile.qr_storage_path));
      }
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}
  };
  useEffect(()=>{void reload();},[lodge?.id]);

  const chooseQr=async()=>{
    if(!lodge)return;
    const result=await DocumentPicker.getDocumentAsync({type:'image/*',copyToCacheDirectory:true,multiple:false});
    if(result.canceled)return;
    const asset=result.assets[0];
    setBusy('qr');setFeedback(null);
    try{
      const path=await uploadLodgePixQr(lodge.id,{uri:asset.uri,name:asset.name,mimeType:asset.mimeType});
      setQrPath(path);setQrUrl(await getLodgePixQrUrl(path));
      setFeedback({type:'success',text:'QR Code carregado. Salve os dados Pix para vinculá-lo à Loja.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const saveProfile=async()=>{
    if(!lodge||!pixKey.trim()||!beneficiary.trim()){setFeedback({type:'error',text:'Informe a chave Pix e o favorecido.'});return;}
    setBusy('profile');setFeedback(null);
    try{
      await saveLodgePaymentProfile(lodge.id,{pixKeyType,pixKey:pixKey.trim(),beneficiaryName:beneficiary.trim(),bankName:bankName.trim(),instructions:instructions.trim(),qrStoragePath:qrPath});
      await reload();setFeedback({type:'success',text:'Dados de recebimento da Loja salvos. O dinheiro será pago diretamente à conta informada.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const create=async()=>{
    const numericAmount=Number(amount.replace(',','.'));
    if(!lodge||!selectedMember||!description.trim()||!dueDate.trim()||!numericAmount){setFeedback({type:'error',text:'Selecione o membro e informe descrição, valor e vencimento.'});return;}
    if(!profile){setFeedback({type:'error',text:'Cadastre primeiro os dados Pix da própria Loja.'});return;}
    setBusy('create');setFeedback(null);
    try{
      await createLodgeCharge({lodgeId:lodge.id,memberId:selectedMember.id,memberName:selectedMember.name,memberEmail:selectedMember.email,memberPhone:selectedMember.whatsapp,description:description.trim(),amount:numericAmount,dueDate:dueDate.trim()});
      await reload();setFeedback({type:'success',text:'Cobrança criada. Compartilhe o valor, vencimento e os dados Pix da própria Loja com o associado.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const settle=async(chargeId:string)=>{
    setBusy(chargeId);setFeedback(null);
    try{await markLodgeChargePaid(chargeId);await reload();setFeedback({type:'success',text:'Cobrança marcada como paga.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · RECEBIMENTOS DA LOJA</Text><Text style={styles.title}>Cobranças</Text><Text style={styles.subtitle}>O Connexio organiza a cobrança, mas não recebe nem repassa valores. O associado paga diretamente para a chave Pix ou QR Code da própria Loja.</Text></View>

    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={styles.formCard}>
      <View style={styles.sectionHead}><Feather name="credit-card" size={19} color={colors.gold}/><View style={styles.flex}><Text style={styles.sectionTitle}>Como a Loja recebe</Text><Text style={styles.helper}>Cadastre a conta da Loja. Nenhum valor passa pelo Connexio.</Text></View></View>
      <Text style={styles.label}>Tipo de chave Pix</Text><View style={styles.chips}>{keyTypes.map((type)=><Pressable key={type} onPress={()=>setPixKeyType(type)} style={[styles.chip,pixKeyType===type&&styles.chipActive]}><Text style={[styles.chipText,pixKeyType===type&&styles.chipTextActive]}>{type}</Text></Pressable>)}</View>
      <TextInput value={pixKey} onChangeText={setPixKey} placeholder="Chave Pix da Loja" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <TextInput value={beneficiary} onChangeText={setBeneficiary} placeholder="Nome do favorecido" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <TextInput value={bankName} onChangeText={setBankName} placeholder="Banco / instituição (opcional)" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <TextInput value={instructions} onChangeText={setInstructions} placeholder="Instruções ao associado (opcional)" placeholderTextColor={colors.textMuted} multiline style={[styles.input,styles.notes]}/>
      <Button label={qrPath?'Trocar QR Code':'Subir QR Code do banco'} variant="secondary" loading={busy==='qr'} onPress={()=>void chooseQr()}/>
      {qrUrl?<Image source={{uri:qrUrl}} style={styles.qr}/>:null}
      <Button label="Salvar dados Pix da Loja" loading={busy==='profile'} onPress={()=>void saveProfile()}/>
    </View>

    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Nova cobrança</Text>
      <Text style={styles.label}>Membro</Text><View style={styles.chips}>{lodgeMembers.map((item)=><Pressable key={item.id} onPress={()=>setSelectedMemberId(item.id)} style={[styles.chip,selectedMemberId===item.id&&styles.chipActive]}><Text style={[styles.chipText,selectedMemberId===item.id&&styles.chipTextActive]}>{item.name}</Text></Pressable>)}</View>
      {!lodgeMembers.length?<Text style={styles.empty}>Cadastre membros na Loja para criar cobranças individuais.</Text>:null}
      <TextInput value={description} onChangeText={setDescription} placeholder="Descrição" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <View style={styles.row}><TextInput value={amount} onChangeText={setAmount} placeholder="Valor" keyboardType="decimal-pad" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/><TextInput value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/></View>
      <Button label="Criar cobrança" loading={busy==='create'} disabled={!profile||!lodgeMembers.length} onPress={()=>void create()}/>
    </View>

    {profile?<View style={styles.paymentCard}><Text style={styles.paymentTitle}>Dados para enviar aos associados</Text><Text style={styles.paymentLine}><Text style={styles.strong}>Favorecido: </Text>{profile.beneficiary_name}</Text><Text style={styles.paymentLine}><Text style={styles.strong}>Pix ({profile.pix_key_type}): </Text>{profile.pix_key}</Text>{profile.bank_name?<Text style={styles.paymentLine}><Text style={styles.strong}>Banco: </Text>{profile.bank_name}</Text>:null}{profile.instructions?<Text style={styles.paymentLine}>{profile.instructions}</Text>:null}{qrUrl?<Image source={{uri:qrUrl}} style={styles.qr}/>:null}</View>:null}

    <View style={styles.section}><Text style={styles.sectionTitle}>Cobranças recentes</Text>{charges.map((charge:any)=><View key={charge.id} style={styles.chargeCard}><View style={styles.chargeIcon}><Feather name={charge.status==='PAID'?'check':'clock'} size={18} color={charge.status==='PAID'?colors.success:colors.gold}/></View><View style={styles.chargeCopy}><Text style={styles.chargeName}>{charge.member_name}</Text><Text style={styles.chargeMeta}>{charge.description} · vence {new Date(`${charge.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</Text></View><View style={styles.chargeRight}><Text style={styles.chargeValue}>{charge.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Text><Text style={[styles.chargeStatus,charge.status==='PAID'&&styles.paid]}>{charge.status==='PAID'?'Pago':'Pendente'}</Text>{charge.status!=='PAID'?<Pressable disabled={busy!==null} onPress={()=>void settle(charge.id)}><Text style={styles.action}>Marcar como pago</Text></Pressable>:null}</View></View>)}{!charges.length?<Text style={styles.empty}>Nenhuma cobrança criada ainda.</Text>:null}</View>

    <View style={styles.notice}><Feather name="shield" size={18} color={colors.gold}/><Text style={styles.noticeText}>Nesta fase, o Connexio não movimenta recursos da Loja. A conferência e a baixa são feitas pelo Tesoureiro. Depois podemos integrar o banco/PSP de cada Loja sem centralizar o dinheiro.</Text></View>
  </Screen>;
}

function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:20},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:26,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},formCard:{gap:12,padding:16,borderRadius:20,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},sectionHead:{flexDirection:'row',gap:10,alignItems:'center'},sectionTitle:{color:colors.text,fontSize:16,fontWeight:'900'},helper:{color:colors.textMuted,fontSize:10,lineHeight:15},label:{color:colors.text,fontSize:11,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.10)'},chipText:{color:colors.textMuted,fontSize:9,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},input:{minHeight:49,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13,fontSize:12},notes:{minHeight:75,paddingTop:12,textAlignVertical:'top'},row:{flexDirection:'row',gap:9},flex:{flex:1},qr:{width:210,height:210,alignSelf:'center',borderRadius:14,backgroundColor:'#fff'},paymentCard:{gap:7,padding:16,borderRadius:18,backgroundColor:'rgba(209,174,87,.07)',borderWidth:1,borderColor:colors.gold},paymentTitle:{color:colors.cream,fontSize:14,fontWeight:'900'},paymentLine:{color:colors.textMuted,fontSize:11,lineHeight:17},strong:{color:colors.text,fontWeight:'900'},section:{gap:10},chargeCard:{flexDirection:'row',alignItems:'center',gap:11,padding:13,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},chargeIcon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},chargeCopy:{flex:1,gap:2},chargeName:{color:colors.text,fontSize:13,fontWeight:'800'},chargeMeta:{color:colors.textMuted,fontSize:10},chargeRight:{alignItems:'flex-end',gap:3},chargeValue:{color:colors.cream,fontSize:12,fontWeight:'900'},chargeStatus:{color:colors.goldSoft,fontSize:9,fontWeight:'800'},paid:{color:colors.success},action:{color:colors.gold,fontSize:9,fontWeight:'900',marginTop:3},empty:{color:colors.textMuted,fontSize:10,textAlign:'center',paddingVertical:10},notice:{flexDirection:'row',gap:10,padding:14,borderRadius:16,backgroundColor:colors.surfaceRaised},noticeText:{flex:1,color:colors.textMuted,fontSize:10,lineHeight:16}});
