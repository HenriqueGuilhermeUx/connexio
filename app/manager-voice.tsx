import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { publishLodgeItem } from '@/lib/lodgeHubRepository';
import { persistFinancialEntry } from '@/lib/lodgeRepository';
import { createObligation } from '@/lib/obligationsRepository';
import { createLodgeCharge, createLodgeChargePix } from '@/lib/paymentRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Preview =
  | { kind:'OBLIGATION'; title:string; dueDate:string }
  | { kind:'PAYABLE'; description:string; amount:number; dueDate:string }
  | { kind:'CHARGE'; memberId:string; memberName:string; memberEmail?:string; memberPhone?:string; amount:number; dueDate:string; description:string }
  | { kind:'PUBLISH'; title:string; summary:string }
  | { kind:'TODAY' };

type Feedback={type:'success'|'error';text:string}|null;

const examples=[
  'Obrigação: renovar certificado digital | 2026-09-30',
  'Conta a pagar: energia elétrica | 480,00 | 2026-08-25',
  'Cobrança: Roberto | 150,00 | 2026-09-10 | Mensalidade setembro',
  'Comunicado: sessão quinta-feira às 20h | Chegada recomendada às 19h30',
  'O que tenho hoje?',
];

export default function ManagerVoiceScreen(){
  const{lodge,lodgeMembers,createAnnouncement}=useApp();
  const[command,setCommand]=useState('');
  const[preview,setPreview]=useState<Preview|null>(null);
  const[listening,setListening]=useState(false);
  const[busy,setBusy]=useState(false);
  const[feedback,setFeedback]=useState<Feedback>(null);

  const analyze=()=>{
    setFeedback(null);
    try{setPreview(parseCommand(command,lodgeMembers));}
    catch(error){setPreview(null);setFeedback({type:'error',text:errorMessage(error)});}
  };

  const listen=()=>{
    if(Platform.OS!=='web'){setFeedback({type:'error',text:'A captura direta de áudio no Android será conectada ao motor Staff/Whisper. Nesta build, use o campo de comando; o executor já é o mesmo.'});return;}
    const w=globalThis as any;
    const SpeechRecognition=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!SpeechRecognition){setFeedback({type:'error',text:'Este navegador não oferece reconhecimento de voz nativo. Digite o comando ou use Chrome/Edge.'});return;}
    const recognition=new SpeechRecognition();
    recognition.lang='pt-BR';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onstart=()=>setListening(true);
    recognition.onend=()=>setListening(false);
    recognition.onerror=(event:any)=>{setListening(false);setFeedback({type:'error',text:`Não foi possível ouvir: ${event?.error??'erro do microfone'}`});};
    recognition.onresult=(event:any)=>{const text=event.results?.[0]?.[0]?.transcript??'';setCommand(text);setPreview(null);};
    recognition.start();
  };

  const execute=async()=>{
    if(!lodge||!preview)return;
    setBusy(true);setFeedback(null);
    try{
      if(preview.kind==='TODAY'){router.push('/manager-today');return;}
      if(preview.kind==='OBLIGATION'){
        await createObligation(lodge.id,{title:preview.title,dueDate:preview.dueDate,responsibleRole:'SECRETARY',recurrence:'NONE',reminderDays:7});
        setFeedback({type:'success',text:'Obrigação criada com alerta de 7 dias.'});
      }
      if(preview.kind==='PAYABLE'){
        await persistFinancialEntry(lodge.id,{type:'PAYABLE',description:preview.description,category:'Voz',amount:preview.amount,dueDate:preview.dueDate,recurring:false});
        setFeedback({type:'success',text:'Conta a pagar criada na Tesouraria.'});
      }
      if(preview.kind==='CHARGE'){
        const chargeId=await createLodgeCharge({lodgeId:lodge.id,memberId:preview.memberId,memberName:preview.memberName,memberEmail:preview.memberEmail,memberPhone:preview.memberPhone,description:preview.description,amount:preview.amount,dueDate:preview.dueDate});
        const pix=await createLodgeChargePix(chargeId);
        setFeedback({type:'success',text:`Cobrança Pix criada para ${preview.memberName}.${pix.brCode?' O Pix já está disponível em Cobranças.':''}`});
      }
      if(preview.kind==='PUBLISH'){
        await publishLodgeItem(lodge.id,{type:'ANNOUNCEMENT',title:preview.title,summary:preview.summary});
        createAnnouncement({title:preview.title,message:preview.summary||preview.title,priority:'IMPORTANT',pushRequested:true});
        setFeedback({type:'success',text:'Comunicado publicado na Central da Loja e enviado por push.'});
      }
      setCommand('');setPreview(null);
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(false);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.hero}><View style={styles.mic}><Feather name="mic" size={32} color={colors.background}/></View><View style={styles.flex}><Text style={styles.eyebrow}>GESTOR PRO · COMANDOS</Text><Text style={styles.title}>Fale com o Connexio</Text><Text style={styles.subtitle}>Você fala ou digita. O Connexio interpreta, mostra o que vai fazer e só grava depois da sua confirmação.</Text></View></View>

    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={styles.commandCard}>
      <Pressable onPress={listen} style={[styles.listenButton,listening&&styles.listening]}><Feather name={listening?'radio':'mic'} size={25} color={listening?colors.background:colors.gold}/><Text style={[styles.listenText,listening&&styles.listenTextOn]}>{listening?'Ouvindo…':Platform.OS==='web'?'Falar agora':'Voz via Staff'}</Text></Pressable>
      <TextInput value={command} onChangeText={(value)=>{setCommand(value);setPreview(null);}} multiline placeholder="Ex.: Conta a pagar: energia | 480 | 2026-08-25" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <Button label="Interpretar comando" disabled={!command.trim()} onPress={analyze}/>
    </View>

    {preview?<View style={styles.preview}><View style={styles.previewHeader}><Feather name="eye" size={18} color={colors.gold}/><Text style={styles.previewTitle}>Confira antes de confirmar</Text></View><PreviewView preview={preview}/><Button label="Confirmar e executar" loading={busy} onPress={()=>void execute()}/><Button label="Cancelar" variant="secondary" disabled={busy} onPress={()=>setPreview(null)}/></View>:null}

    <View style={styles.examples}><Text style={styles.sectionTitle}>Exemplos que já funcionam</Text>{examples.map(example=><Pressable key={example} onPress={()=>{setCommand(example);setPreview(null);}} style={styles.example}><Feather name="command" size={15} color={colors.gold}/><Text style={styles.exampleText}>{example}</Text></Pressable>)}</View>

    <View style={styles.staffCard}><Feather name="cpu" size={20} color={colors.gold}/><View style={styles.flex}><Text style={styles.staffTitle}>Motor Staff + Whisper</Text><Text style={styles.staffText}>O executor do Connexio já está separado da transcrição. No Android, o próximo passo é ligar a gravação ao motor Staff/Whisper; isso não muda nenhuma regra de negócio nem as confirmações de segurança acima.</Text></View></View>
  </Screen>;
}

function parseCommand(raw:string,members:any[]):Preview{
  const text=raw.trim();if(!text)throw new Error('Diga ou digite um comando.');
  const normalized=text.toLowerCase();
  if(normalized.includes('o que tenho hoje')||normalized==='hoje'||normalized.includes('tarefas de hoje'))return{kind:'TODAY'};
  const obligation=text.match(/(?:obrigação|obrigacao)\s*:\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})/i);
  if(obligation)return{kind:'OBLIGATION',title:obligation[1].trim(),dueDate:obligation[2]};
  const payable=text.match(/conta a pagar\s*:\s*(.+?)\s*\|\s*([\d.,]+)\s*\|\s*(\d{4}-\d{2}-\d{2})/i);
  if(payable)return{kind:'PAYABLE',description:payable[1].trim(),amount:money(payable[2]),dueDate:payable[3]};
  const charge=text.match(/(?:cobrança|cobranca)\s*:\s*(.+?)\s*\|\s*([\d.,]+)\s*\|\s*(\d{4}-\d{2}-\d{2})(?:\s*\|\s*(.+))?/i);
  if(charge){const query=charge[1].trim().toLowerCase();const member=members.find((m:any)=>m.name.toLowerCase().includes(query)||m.email?.toLowerCase()===query);if(!member)throw new Error(`Não encontrei “${charge[1].trim()}” entre os membros da Loja.`);return{kind:'CHARGE',memberId:member.id,memberName:member.name,memberEmail:member.email,memberPhone:member.whatsapp,amount:money(charge[2]),dueDate:charge[3],description:charge[4]?.trim()||'Mensalidade'};}
  const publish=text.match(/(?:comunicado|publique|publicar)\s*:\s*(.+?)(?:\s*\|\s*(.+))?$/i);
  if(publish)return{kind:'PUBLISH',title:publish[1].trim(),summary:publish[2]?.trim()||publish[1].trim()};
  throw new Error('Ainda não reconheci esse formato. Use um dos exemplos abaixo; vamos ampliar o vocabulário com o motor Staff.');
}
function money(value:string){const normalized=value.includes(',')?value.replace(/\./g,'').replace(',','.'):value;const amount=Number(normalized);if(!Number.isFinite(amount)||amount<=0)throw new Error('Valor inválido.');return amount;}
function PreviewView({preview}:{preview:Preview}){if(preview.kind==='TODAY')return<Text style={styles.previewText}>Abrir o painel “Hoje na Loja”.</Text>;if(preview.kind==='OBLIGATION')return<Text style={styles.previewText}>Criar obrigação “{preview.title}” para {preview.dueDate}.</Text>;if(preview.kind==='PAYABLE')return<Text style={styles.previewText}>Criar conta a pagar “{preview.description}” de {preview.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}, vencimento {preview.dueDate}.</Text>;if(preview.kind==='CHARGE')return<Text style={styles.previewText}>Gerar cobrança Pix de {preview.amount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} para {preview.memberName}, vencimento {preview.dueDate}, descrição “{preview.description}”.</Text>;return<Text style={styles.previewText}>Publicar “{preview.title}” na Central da Loja e enviar push. {preview.summary}</Text>;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},hero:{flexDirection:'row',alignItems:'center',gap:15,padding:18,borderRadius:22,backgroundColor:'rgba(209,174,87,.10)',borderWidth:1,borderColor:colors.gold},mic:{width:62,height:62,borderRadius:20,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:4},eyebrow:{color:colors.gold,fontSize:9,fontWeight:'900',letterSpacing:1.1},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:11,lineHeight:17},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},commandCard:{gap:12,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},listenButton:{alignSelf:'center',minWidth:180,alignItems:'center',gap:6,paddingVertical:14,paddingHorizontal:20,borderRadius:18,borderWidth:1,borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.06)'},listening:{backgroundColor:colors.gold},listenText:{color:colors.goldSoft,fontSize:11,fontWeight:'900'},listenTextOn:{color:colors.background},input:{minHeight:105,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,padding:13,textAlignVertical:'top'},preview:{gap:12,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},previewHeader:{flexDirection:'row',alignItems:'center',gap:8},previewTitle:{color:colors.cream,fontSize:14,fontWeight:'900'},previewText:{color:colors.text,fontSize:12,lineHeight:19},examples:{gap:8},sectionTitle:{color:colors.cream,fontSize:16,fontWeight:'900'},example:{flexDirection:'row',alignItems:'center',gap:9,padding:11,borderRadius:13,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},exampleText:{flex:1,color:colors.textMuted,fontSize:10,lineHeight:15},staffCard:{flexDirection:'row',gap:11,padding:14,borderRadius:16,backgroundColor:colors.surfaceRaised},staffTitle:{color:colors.text,fontSize:12,fontWeight:'900'},staffText:{color:colors.textMuted,fontSize:9,lineHeight:15}});
