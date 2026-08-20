import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { approveMinutes, loadMinutes, loadSessions, publishMinutes, saveMinutes, submitMinutesForReview } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Feedback = { type:'success'|'error'; text:string } | null;

export default function ManagerMinutesScreen() {
  const { lodge, lodgeMembers, membership } = useApp();
  const [sessions,setSessions]=useState<any[]>([]);
  const [history,setHistory]=useState<any[]>([]);
  const [selectedSessionId,setSelectedSessionId]=useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0,10));
  const [sessionLabel, setSessionLabel] = useState('Sessão ordinária');
  const [location,setLocation]=useState('');
  const [matters, setMatters] = useState('');
  const [decisions, setDecisions] = useState('');
  const [pendingItems, setPendingItems] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [transcript,setTranscript]=useState('');
  const [savedMinutes,setSavedMinutes]=useState<any|null>(null);
  const [audience,setAudience]=useState('ALL');
  const [listening,setListening]=useState(false);
  const [busy,setBusy]=useState<string|null>(null);
  const [feedback,setFeedback]=useState<Feedback>(null);

  const isMaster=membership?.role==='WORSHIPFUL_MASTER';
  const selectedSession=sessions.find((item)=>item.id===selectedSessionId);
  const attendance=useMemo(()=>{
    const ids=(selectedSession?.lodge_attendance??[]).map((item:any)=>item.member_id);
    return lodgeMembers.filter((member)=>ids.includes(member.id));
  },[selectedSession,lodgeMembers]);

  const reload=async()=>{
    if(!lodge)return;
    try{
      const[s,h]=await Promise.all([loadSessions(lodge.id),loadMinutes(lodge.id)]);
      setSessions(s??[]);setHistory(h??[]);
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}
  };
  useEffect(()=>{void reload();},[lodge?.id]);

  const selectSession=(session:any)=>{
    setSelectedSessionId(session.id);
    setMeetingDate(String(session.starts_at).slice(0,10));
    setSessionLabel(session.title||'Sessão ordinária');
    setLocation(session.location||'');
    setSavedMinutes(null);
  };

  const dictate=()=>{
    setFeedback(null);
    if(Platform.OS!=='web'){
      setFeedback({type:'error',text:'No Android, a gravação será enviada ao motor Staff/Whisper. Nesta versão Web, a ditagem já funciona; no celular você ainda pode colar ou digitar o relato.'});
      return;
    }
    const w=globalThis as any;
    const SpeechRecognition=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!SpeechRecognition){setFeedback({type:'error',text:'Este navegador não oferece reconhecimento de voz. Use Chrome ou Edge, ou digite o relato.'});return;}
    const recognition=new SpeechRecognition();
    recognition.lang='pt-BR';recognition.interimResults=true;recognition.continuous=true;
    let finalText=transcript;
    recognition.onstart=()=>setListening(true);
    recognition.onend=()=>setListening(false);
    recognition.onerror=(event:any)=>{setListening(false);setFeedback({type:'error',text:`Microfone: ${event?.error??'não disponível'}`});};
    recognition.onresult=(event:any)=>{
      let interim='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        const piece=event.results[i][0]?.transcript??'';
        if(event.results[i].isFinal) finalText=`${finalText} ${piece}`.trim(); else interim+=piece;
      }
      setTranscript(`${finalText}${interim?` ${interim}`:''}`.trim());
    };
    recognition.start();
    (globalThis as any).__connexioMinutesRecognition=recognition;
  };

  const stopDictation=()=>{
    const recognition=(globalThis as any).__connexioMinutesRecognition;
    if(recognition?.stop) recognition.stop();
    setListening(false);
  };

  const structureTranscript=()=>{
    if(!transcript.trim()){setFeedback({type:'error',text:'Dite ou escreva primeiro o relato da sessão.'});return;}
    const structured=structureMinutes(transcript);
    setMatters(structured.matters);
    setDecisions(structured.decisions);
    setPendingItems(structured.pendingItems);
    setClosingNotes(structured.closingNotes);
    setFeedback({type:'success',text:'Ditado organizado. Revise os campos antes de salvar.'});
  };

  const generated = buildGeneratedText({lodgeName:lodge?.name??'Loja',meetingDate,sessionLabel,location,attendanceNames:attendance.map((m)=>m.name),matters,decisions,pendingItems,closingNotes});

  const save=async()=>{
    if(!lodge||!meetingDate.trim()||!sessionLabel.trim()){setFeedback({type:'error',text:'Informe data e sessão.'});return;}
    setBusy('save');setFeedback(null);
    try{
      const row=await saveMinutes(lodge.id,{
        meetingDate:meetingDate.trim(),sessionLabel:sessionLabel.trim(),location:location.trim(),matters:matters.trim(),decisions:decisions.trim(),pendingItems:pendingItems.trim(),closingNotes:closingNotes.trim(),sessionId:selectedSessionId||null,transcript:transcript.trim(),generatedText:generated,attendanceSnapshot:attendance.map((m)=>({id:m.id,name:m.name}))
      });
      setSavedMinutes(row);await reload();setFeedback({type:'success',text:'Ata salva como rascunho. Agora você pode enviar ao Venerável ou publicar para os membros.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const sendReview=async()=>{
    if(!savedMinutes?.id){setFeedback({type:'error',text:'Salve a ata antes de enviar para revisão.'});return;}
    setBusy('review');setFeedback(null);
    try{await submitMinutesForReview(savedMinutes.id);setSavedMinutes({...savedMinutes,status:'IN_REVIEW'});await reload();setFeedback({type:'success',text:'Ata enviada ao Venerável para revisão.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const approve=async()=>{
    if(!savedMinutes?.id)return;
    setBusy('approve');setFeedback(null);
    try{await approveMinutes(savedMinutes.id);setSavedMinutes({...savedMinutes,status:'APPROVED'});await reload();setFeedback({type:'success',text:'Ata aprovada pelo Venerável.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  const publish=async()=>{
    if(!savedMinutes?.id){setFeedback({type:'error',text:'Salve a ata antes de publicar.'});return;}
    setBusy('publish');setFeedback(null);
    try{await publishMinutes(savedMinutes.id,audience);setSavedMinutes({...savedMinutes,status:'PUBLISHED'});await reload();setFeedback({type:'success',text:'Ata publicada na Central da Loja para o público selecionado.'});}
    catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(null);}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · SECRETARIA</Text><Text style={styles.title}>Atas Inteligentes por Voz</Text><Text style={styles.subtitle}>Selecione a sessão, dite naturalmente o que aconteceu e deixe o Connexio montar a estrutura. Você revisa antes de salvar, enviar ao Venerável ou publicar.</Text></View>

    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={styles.card}><Text style={styles.sectionTitle}>1. Sessão</Text><View style={styles.chips}>{sessions.slice(0,8).map((session)=><Pressable key={session.id} onPress={()=>selectSession(session)} style={[styles.chip,selectedSessionId===session.id&&styles.chipActive]}><Text style={[styles.chipText,selectedSessionId===session.id&&styles.chipTextActive]}>{session.title} · {new Date(session.starts_at).toLocaleDateString('pt-BR')}</Text></Pressable>)}</View><View style={styles.row}><TextInput value={meetingDate} onChangeText={setMeetingDate} placeholder="Data AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/><TextInput value={sessionLabel} onChangeText={setSessionLabel} placeholder="Tipo de sessão" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/></View><TextInput value={location} onChangeText={setLocation} placeholder="Local" placeholderTextColor={colors.textMuted} style={styles.input}/>{selectedSession?<Text style={styles.attendance}>Presenças já registradas: {attendance.length?attendance.map((m)=>m.name).join(', '):'nenhuma frequência registrada ainda'}</Text>:null}</View>

    <View style={styles.voiceCard}><View style={styles.voiceHead}><View style={styles.voiceIcon}><Feather name="mic" size={27} color={colors.background}/></View><View style={styles.flex}><Text style={styles.sectionTitle}>2. Ditar a ata</Text><Text style={styles.helper}>Fale do seu jeito. Ex.: “Foi apresentada a proposta... colocada em votação... aprovada... ficou responsável...”</Text></View></View><TextInput value={transcript} onChangeText={setTranscript} multiline placeholder="O relato/transcrição da sessão aparecerá aqui..." placeholderTextColor={colors.textMuted} style={[styles.input,styles.transcript]}/><View style={styles.row}><Button label={listening?'Ouvindo…':'Ditar ata agora'} onPress={dictate} disabled={listening} style={styles.flex}/>{listening?<Button label="Parar gravação" variant="secondary" onPress={stopDictation} style={styles.flex}/>:null}</View><Button label="Estruturar ditado" variant="secondary" disabled={!transcript.trim()} onPress={structureTranscript}/></View>

    <View style={styles.card}><Text style={styles.sectionTitle}>3. Revisar estrutura</Text><Area label="Assuntos tratados" value={matters} onChangeText={setMatters}/><Area label="Deliberações e votações" value={decisions} onChangeText={setDecisions}/><Area label="Pendências, responsáveis e prazos" value={pendingItems} onChangeText={setPendingItems}/><Area label="Encerramento" value={closingNotes} onChangeText={setClosingNotes}/><Button label="Salvar rascunho da ata" loading={busy==='save'} onPress={()=>void save()}/></View>

    <View style={styles.preview}><Text style={styles.previewTitle}>Prévia institucional</Text><Text selectable style={styles.previewText}>{generated}</Text></View>

    {savedMinutes?<View style={styles.workflow}><Text style={styles.sectionTitle}>4. Destino da ata</Text><Text style={styles.status}>Status: {statusLabel(savedMinutes.status)}</Text><View style={styles.row}><Button label="Enviar ao Venerável" variant="secondary" loading={busy==='review'} onPress={()=>void sendReview()} style={styles.flex}/>{isMaster?<Button label="Aprovar como Venerável" variant="secondary" loading={busy==='approve'} onPress={()=>void approve()} style={styles.flex}/>:null}</View><Text style={styles.label}>Publicar para</Text><View style={styles.chips}>{[['ALL','Todos'],['APPRENTICE','Aprendizes'],['FELLOWCRAFT','Companheiros'],['MASTER','Mestres'],['LEADERSHIP','Liderança']].map(([value,label])=><Pressable key={value} onPress={()=>setAudience(value)} style={[styles.chip,audience===value&&styles.chipActive]}><Text style={[styles.chipText,audience===value&&styles.chipTextActive]}>{label}</Text></Pressable>)}</View><Button label="Publicar na Central da Loja" loading={busy==='publish'} onPress={()=>void publish()}/></View>:null}

    <View style={styles.history}><Text style={styles.sectionTitle}>Atas recentes</Text>{history.slice(0,6).map((item)=><Pressable key={item.id} onPress={()=>{setSavedMinutes(item);setMeetingDate(item.meeting_date);setSessionLabel(item.session_label);setLocation(item.location??'');setMatters(item.matters??'');setDecisions(item.decisions??'');setPendingItems(item.pending_items??'');setClosingNotes(item.closing_notes??'');setTranscript(item.transcript??'');setSelectedSessionId(item.session_id??'');}} style={styles.historyItem}><View style={styles.historyIcon}><Feather name="file-text" size={17} color={colors.gold}/></View><View style={styles.flex}><Text style={styles.historyTitle}>{item.session_label}</Text><Text style={styles.historyMeta}>{new Date(`${item.meeting_date}T12:00:00`).toLocaleDateString('pt-BR')} · {statusLabel(item.status)}</Text></View><Feather name="chevron-right" size={18} color={colors.textMuted}/></Pressable>)}{!history.length?<Text style={styles.helper}>Nenhuma ata registrada ainda.</Text>:null}</View>
  </Screen>;
}

function structureMinutes(raw:string){
  const sentences=raw.replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).map((s)=>s.trim()).filter(Boolean);
  const decisions:string[]=[];const pending:string[]=[];const closing:string[]=[];const matters:string[]=[];
  for(const sentence of sentences){
    const lower=sentence.toLowerCase();
    if(/aprovad|rejeitad|deliber|votaç|votacao|decid|ficou definido|por unanimidade|maioria/.test(lower)) decisions.push(sentence);
    else if(/responsável|responsavel|ficou encarregado|pendência|pendencia|prazo|até o dia|ate o dia/.test(lower)) pending.push(sentence);
    else if(/encerr|encerrou|finaliz|nada mais havendo/.test(lower)) closing.push(sentence);
    else matters.push(sentence);
  }
  return{
    matters:matters.join('\n')||raw.trim(),
    decisions:decisions.join('\n'),
    pendingItems:pending.join('\n'),
    closingNotes:closing.join('\n'),
  };
}

function buildGeneratedText(input:{lodgeName:string;meetingDate:string;sessionLabel:string;location:string;attendanceNames:string[];matters:string;decisions:string;pendingItems:string;closingNotes:string}){
  const date=input.meetingDate?new Date(`${input.meetingDate}T12:00:00`).toLocaleDateString('pt-BR'):'—';
  return [`ATA · ${input.lodgeName}`,`${input.sessionLabel} · ${date}${input.location?` · ${input.location}`:''}`,`Presentes: ${input.attendanceNames.length?input.attendanceNames.join(', '):'a confirmar'}`,`Assuntos tratados\n${input.matters||'—'}`,`Deliberações e votações\n${input.decisions||'—'}`,`Pendências, responsáveis e prazos\n${input.pendingItems||'—'}`,`Encerramento\n${input.closingNotes||'—'}`].join('\n\n');
}
function statusLabel(status:string){return({DRAFT:'Rascunho',IN_REVIEW:'Em revisão',APPROVED:'Aprovada',PUBLISHED:'Publicada',ARCHIVED:'Arquivada'} as Record<string,string>)[status]??status;}
function Area({ label, value, onChangeText }: { label:string; value:string; onChangeText:(value:string)=>void }){return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} multiline placeholder={label} placeholderTextColor={colors.textMuted} style={[styles.input,styles.area]}/></View>;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:28,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},card:{gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},voiceCard:{gap:12,padding:17,borderRadius:20,backgroundColor:'rgba(209,174,87,.07)',borderWidth:1,borderColor:colors.gold},voiceHead:{flexDirection:'row',alignItems:'center',gap:12},voiceIcon:{width:50,height:50,borderRadius:16,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},sectionTitle:{color:colors.cream,fontSize:16,fontWeight:'900'},helper:{color:colors.textMuted,fontSize:10,lineHeight:16},row:{flexDirection:'row',gap:8,flexWrap:'wrap'},flex:{flex:1},field:{gap:6},label:{color:colors.text,fontSize:11,fontWeight:'800'},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},area:{minHeight:90,paddingTop:12,textAlignVertical:'top'},transcript:{minHeight:150,paddingTop:12,textAlignVertical:'top'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.12)'},chipText:{color:colors.textMuted,fontSize:9,fontWeight:'800'},chipTextActive:{color:colors.goldSoft},attendance:{color:colors.textMuted,fontSize:10,lineHeight:16},preview:{padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold,gap:9},previewTitle:{color:colors.goldSoft,fontSize:13,fontWeight:'900'},previewText:{color:colors.textMuted,fontSize:11,lineHeight:18},workflow:{gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},status:{color:colors.goldSoft,fontSize:10,fontWeight:'900'},history:{gap:9},historyItem:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:15,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},historyIcon:{width:38,height:38,borderRadius:11,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},historyTitle:{color:colors.text,fontSize:12,fontWeight:'900'},historyMeta:{color:colors.textMuted,fontSize:9}});
