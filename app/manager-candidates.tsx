import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { CandidateStage, createCandidate, loadCandidates, toggleCandidateCheck, updateCandidateStage } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const stages: CandidateStage[] = ['OBSERVATION','SOCIAL_EVENTS','INTERVIEW','INQUIRY','LODGE_DISCUSSION','READY','CLOSED'];
type Candidate = any;

export default function ManagerCandidatesScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<Candidate[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const reload = () => { if (lodge) void loadCandidates(lodge.id).then(setItems).catch(() => undefined); };
  useEffect(reload, [lodge?.id]);

  const add = async () => {
    if (!lodge || !name.trim()) { Alert.alert('Informe o nome do candidato'); return; }
    try {
      await createCandidate(lodge.id, { fullName: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined });
      setName(''); setEmail(''); setPhone(''); setNotes(''); reload();
    } catch (error) { Alert.alert('Não foi possível cadastrar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  const move = async (candidate: Candidate, stage: CandidateStage) => {
    try { await updateCandidateStage(candidate.id, stage); setItems((current) => current.map((row) => row.id === candidate.id ? { ...row, stage } : row)); }
    catch (error) { Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  const toggle = async (candidateId: string, check: any) => {
    try {
      await toggleCandidateCheck(check.id, !check.is_done);
      setItems((current) => current.map((candidate) => candidate.id !== candidateId ? candidate : { ...candidate, lodge_candidate_checks: candidate.lodge_candidate_checks.map((item: any) => item.id === check.id ? { ...item, is_done: !item.is_done } : item) }));
    } catch (error) { Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · CANDIDATOS</Text><Text style={styles.title}>Candidatos & sindicâncias</Text><Text style={styles.subtitle}>Um workflow estruturado para acompanhar observação, entrevistas e sindicância sem transformar a decisão em simples memória ou conversa solta.</Text></View>
    <View style={styles.notice}><Feather name="shield" size={18} color={colors.gold}/><Text style={styles.noticeText}>Dados de candidatos são restritos aos gestores da Loja. O Connexio organiza evidências e etapas; a decisão continua sendo da Loja.</Text></View>

    <View style={styles.form}><Text style={styles.formTitle}>Novo candidato</Text><TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.textMuted} style={styles.input}/><View style={styles.row}><TextInput value={email} onChangeText={setEmail} placeholder="E-mail (opcional)" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/><TextInput value={phone} onChangeText={setPhone} placeholder="Telefone (opcional)" placeholderTextColor={colors.textMuted} style={[styles.input,styles.flex]}/></View><TextInput value={notes} onChangeText={setNotes} multiline placeholder="Observações iniciais" placeholderTextColor={colors.textMuted} style={[styles.input,styles.notes]}/><Button label="Cadastrar candidato" onPress={() => void add()}/></View>

    <View style={styles.list}>{items.map((candidate) => {
      const checks = candidate.lodge_candidate_checks ?? [];
      const done = checks.filter((item:any) => item.is_done).length;
      return <View key={candidate.id} style={styles.card}>
        <View style={styles.cardHeader}><View style={styles.avatar}><Text style={styles.avatarText}>{candidate.full_name?.[0] ?? 'C'}</Text></View><View style={styles.flex}><Text style={styles.name}>{candidate.full_name}</Text><Text style={styles.meta}>{stageLabel(candidate.stage)} · checklist {done}/{checks.length}</Text></View></View>
        <Text style={styles.label}>Etapa</Text><View style={styles.chips}>{stages.map((stage) => <Chip key={stage} label={stageLabel(stage)} active={candidate.stage === stage} onPress={() => void move(candidate, stage)} />)}</View>
        <View style={styles.checklist}>{checks.map((check:any) => <Pressable key={check.id} onPress={() => void toggle(candidate.id, check)} style={styles.check}><Feather name={check.is_done ? 'check-square':'square'} size={17} color={check.is_done ? colors.gold:colors.textMuted}/><Text style={[styles.checkText,check.is_done&&styles.checkDone]}>{check.label}</Text></Pressable>)}</View>
        {candidate.notes ? <Text style={styles.notesText}>{candidate.notes}</Text> : null}
      </View>;
    })}</View>
    {!items.length ? <Text style={styles.empty}>Nenhum candidato em acompanhamento.</Text> : null}
  </Screen>;
}

function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}) { return <Pressable onPress={onPress} style={[styles.chip,active&&styles.chipActive]}><Text style={[styles.chipText,active&&styles.chipTextActive]}>{label}</Text></Pressable>; }
function stageLabel(stage:CandidateStage) { const map:Record<CandidateStage,string>={OBSERVATION:'Observação',SOCIAL_EVENTS:'Convivência',INTERVIEW:'Entrevista',INQUIRY:'Sindicância',LODGE_DISCUSSION:'Discussão em Loja',READY:'Pronto para decisão',CLOSED:'Encerrado'}; return map[stage]; }
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},notice:{flexDirection:'row',gap:10,padding:13,borderRadius:15,backgroundColor:colors.surfaceRaised,borderWidth:1,borderColor:colors.border},noticeText:{flex:1,color:colors.textMuted,fontSize:10,lineHeight:15},form:{gap:11,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},formTitle:{color:colors.text,fontSize:16,fontWeight:'900'},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},notes:{minHeight:80,paddingTop:12,textAlignVertical:'top'},row:{flexDirection:'row',gap:8},flex:{flex:1},list:{gap:11},card:{gap:12,padding:15,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},cardHeader:{flexDirection:'row',alignItems:'center',gap:10},avatar:{width:42,height:42,borderRadius:13,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},avatarText:{color:colors.cream,fontWeight:'900',fontSize:16},name:{color:colors.text,fontSize:14,fontWeight:'900'},meta:{color:colors.textMuted,fontSize:9},label:{color:colors.textMuted,fontSize:9,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6},chip:{paddingHorizontal:9,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,0.1)'},chipText:{color:colors.textMuted,fontSize:8,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},checklist:{gap:7,padding:12,borderRadius:14,backgroundColor:colors.surfaceRaised},check:{flexDirection:'row',alignItems:'center',gap:8},checkText:{color:colors.text,fontSize:10},checkDone:{color:colors.textMuted,textDecorationLine:'line-through'},notesText:{color:colors.textMuted,fontSize:10,lineHeight:15},empty:{color:colors.textMuted,fontSize:11,textAlign:'center',paddingVertical:20}});
