import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { publishLodgeItem } from '@/lib/lodgeHubRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const types=['ANNOUNCEMENT','SESSION','MINUTES','PLAN','LEARNING','DOCUMENT'] as const;
const audiences=['ALL','APPRENTICE','COMPANION','MASTER','LEADERSHIP'] as const;

type Feedback={type:'success'|'error';text:string}|null;

export default function ManagerPublishScreen(){
  const{lodge,createAnnouncement}=useApp();
  const[type,setType]=useState<(typeof types)[number]>('ANNOUNCEMENT');
  const[audience,setAudience]=useState<(typeof audiences)[number]>('ALL');
  const[title,setTitle]=useState('');
  const[summary,setSummary]=useState('');
  const[push,setPush]=useState(true);
  const[busy,setBusy]=useState(false);
  const[feedback,setFeedback]=useState<Feedback>(null);

  const publish=async()=>{
    if(!lodge||!title.trim()){setFeedback({type:'error',text:'Informe um título para a publicação.'});return;}
    setBusy(true);setFeedback(null);
    try{
      await publishLodgeItem(lodge.id,{type,title:title.trim(),summary:summary.trim()||undefined,audience});
      if(push){createAnnouncement({title:title.trim(),message:summary.trim()||title.trim(),priority:'IMPORTANT',pushRequested:true});}
      setTitle('');setSummary('');
      setFeedback({type:'success',text:`Publicado na Central da Loja${push?' e enviado por push':''}.`});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(false);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTÃO · COMUNICAÇÃO</Text><Text style={styles.title}>Publicar para a Loja</Text><Text style={styles.subtitle}>Compartilhe sessões, atas, planejamento, educação, documentos e comunicados com os membros da sua Loja. O conteúdo fica na Central da Loja e pode também virar push.</Text></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}
    <View style={styles.card}>
      <Text style={styles.label}>Tipo de publicação</Text>
      <View style={styles.chips}>{types.map(value=><Pressable key={value} onPress={()=>setType(value)} style={[styles.chip,type===value&&styles.chipActive]}><Text style={[styles.chipText,type===value&&styles.chipTextActive]}>{typeLabel(value)}</Text></Pressable>)}</View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <TextInput value={summary} onChangeText={setSummary} multiline placeholder="Resumo, orientação, pauta ou mensagem aos irmãos" placeholderTextColor={colors.textMuted} style={[styles.input,styles.notes]}/>
      <Text style={styles.label}>Público</Text>
      <View style={styles.chips}>{audiences.map(value=><Pressable key={value} onPress={()=>setAudience(value)} style={[styles.chip,audience===value&&styles.chipActive]}><Text style={[styles.chipText,audience===value&&styles.chipTextActive]}>{audienceLabel(value)}</Text></Pressable>)}</View>
      <Pressable onPress={()=>setPush(v=>!v)} style={styles.toggle}><View style={[styles.check,push&&styles.checkOn]}>{push?<Feather name="check" size={14} color={colors.background}/>:null}</View><View style={styles.flex}><Text style={styles.toggleTitle}>Enviar push aos membros</Text><Text style={styles.toggleText}>A publicação continuará disponível na Central da Loja mesmo se o push estiver desativado.</Text></View></Pressable>
      <Button label="Publicar agora" loading={busy} onPress={()=>void publish()}/>
    </View>
  </Screen>;
}

function typeLabel(value:string){const map:Record<string,string>={ANNOUNCEMENT:'Comunicado',SESSION:'Sessão',MINUTES:'Ata',PLAN:'Planejamento',LEARNING:'Educação',DOCUMENT:'Documento'};return map[value]??value;}
function audienceLabel(value:string){const map:Record<string,string>={ALL:'Todos',APPRENTICE:'Aprendizes',COMPANION:'Companheiros',MASTER:'Mestres',LEADERSHIP:'Lideranças'};return map[value]??value;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},card:{gap:12,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},label:{color:colors.textMuted,fontSize:9,fontWeight:'900'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.10)'},chipText:{color:colors.textMuted,fontSize:9,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},notes:{minHeight:100,paddingTop:12,textAlignVertical:'top'},toggle:{flexDirection:'row',alignItems:'center',gap:10,padding:11,borderRadius:13,backgroundColor:colors.surfaceRaised},check:{width:24,height:24,borderRadius:7,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},checkOn:{backgroundColor:colors.gold,borderColor:colors.gold},flex:{flex:1,gap:2},toggleTitle:{color:colors.text,fontSize:11,fontWeight:'800'},toggleText:{color:colors.textMuted,fontSize:9,lineHeight:14}});
