import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { loadPeopleSnapshot, PeopleSnapshot, saveMemberCare } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const degrees: PeopleSnapshot['degree'][] = ['APPRENTICE', 'COMPANION', 'MASTER'];
const statuses: PeopleSnapshot['followup_status'][] = ['OK', 'ATTENTION', 'URGENT'];
const potentials: PeopleSnapshot['leadership_potential'][] = ['UNASSESSED', 'DEVELOPING', 'HIGH'];

export default function ManagerPeopleScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<PeopleSnapshot[]>([]);
  const [selected, setSelected] = useState<PeopleSnapshot | null>(null);
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');

  const reload = () => {
    if (!lodge) return;
    void loadPeopleSnapshot(lodge.id).then(setItems).catch(() => undefined);
  };
  useEffect(reload, [lodge?.id]);

  const attention = useMemo(() => items.filter((item) => item.followup_status !== 'OK' || (item.next_followup_at && new Date(item.next_followup_at) <= new Date())).length, [items]);

  const patchSelected = (patch: Partial<PeopleSnapshot>) => setSelected((current) => current ? { ...current, ...patch } : current);

  const save = async () => {
    if (!lodge || !selected) return;
    try {
      await saveMemberCare(lodge.id, selected.member_id, {
        degree: selected.degree,
        nextFollowupAt: nextDate ? new Date(`${nextDate}T12:00:00`).toISOString() : undefined,
        followupStatus: selected.followup_status,
        leadershipPotential: selected.leadership_potential,
        privateNotes: notes || undefined,
      });
      setSelected(null); setNextDate(''); setNotes(''); reload();
      Alert.alert('Acompanhamento registrado', 'O próximo acompanhamento pode alimentar automaticamente o Hoje na Loja.');
    } catch (error) { Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · PESSOAS</Text><Text style={styles.title}>Acompanhamento dos irmãos</Text><Text style={styles.subtitle}>Não é uma lista de “faltosos”. É uma visão para perceber quem precisa de proximidade, formação e oportunidade de participar.</Text></View>
    <View style={styles.summary}><Feather name="heart" size={21} color={colors.gold} /><Text style={styles.summaryValue}>{attention}</Text><Text style={styles.summaryText}>irmãos pedem atenção de acompanhamento</Text></View>

    <View style={styles.list}>{items.map((item) => <Pressable key={item.member_id} onPress={() => { setSelected(item); setNextDate(item.next_followup_at?.slice(0,10) ?? ''); }} style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.member_name?.[0] ?? 'I'}</Text></View>
      <View style={styles.flex}><Text style={styles.name}>{item.member_name}</Text><Text style={styles.meta}>{degreeLabel(item.degree)} · {item.attendance_count} presença(s)</Text><Text style={styles.meta}>Última presença: {item.last_attendance_at ? new Date(item.last_attendance_at).toLocaleDateString('pt-BR') : 'sem registro'}</Text></View>
      <View style={[styles.status, item.followup_status === 'URGENT' && styles.urgent, item.followup_status === 'ATTENTION' && styles.attention]}><Text style={styles.statusText}>{statusLabel(item.followup_status)}</Text></View>
    </Pressable>)}</View>
    {!items.length ? <Text style={styles.empty}>Os membros aparecerão aqui quando a Loja estiver conectada ao backend.</Text> : null}

    {selected ? <View style={styles.editor}>
      <Text style={styles.editorTitle}>{selected.member_name}</Text>
      <Text style={styles.label}>Grau</Text><View style={styles.chips}>{degrees.map((value) => <Chip key={value} label={degreeLabel(value)} active={selected.degree === value} onPress={() => patchSelected({ degree: value })} />)}</View>
      <Text style={styles.label}>Situação de acompanhamento</Text><View style={styles.chips}>{statuses.map((value) => <Chip key={value} label={statusLabel(value)} active={selected.followup_status === value} onPress={() => patchSelected({ followup_status: value })} />)}</View>
      <Text style={styles.label}>Desenvolvimento de liderança</Text><View style={styles.chips}>{potentials.map((value) => <Chip key={value} label={potentialLabel(value)} active={selected.leadership_potential === value} onPress={() => patchSelected({ leadership_potential: value })} />)}</View>
      <TextInput value={nextDate} onChangeText={setNextDate} placeholder="Próximo acompanhamento AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={styles.input} />
      <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Observação privada de acompanhamento" placeholderTextColor={colors.textMuted} style={[styles.input, styles.notes]} />
      <Button label="Registrar acompanhamento" onPress={() => void save()} /><Button label="Cancelar" variant="secondary" onPress={() => setSelected(null)} />
    </View> : null}
  </Screen>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function degreeLabel(v: PeopleSnapshot['degree']) { return v === 'APPRENTICE' ? 'Aprendiz' : v === 'COMPANION' ? 'Companheiro' : 'Mestre'; }
function statusLabel(v: PeopleSnapshot['followup_status']) { return v === 'URGENT' ? 'Urgente' : v === 'ATTENTION' ? 'Atenção' : 'Acompanhado'; }
function potentialLabel(v: PeopleSnapshot['leadership_potential']) { return v === 'HIGH' ? 'Alto' : v === 'DEVELOPING' ? 'Em desenvolvimento' : 'Não avaliado'; }
const styles = StyleSheet.create({ content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},summary:{flexDirection:'row',alignItems:'baseline',gap:8,padding:15,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},summaryValue:{color:colors.cream,fontSize:24,fontWeight:'900'},summaryText:{color:colors.textMuted,fontSize:11,flex:1},list:{gap:9},card:{flexDirection:'row',alignItems:'center',gap:11,padding:13,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},avatar:{width:42,height:42,borderRadius:13,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},avatarText:{color:colors.cream,fontSize:16,fontWeight:'900'},flex:{flex:1,gap:2},name:{color:colors.text,fontSize:13,fontWeight:'800'},meta:{color:colors.textMuted,fontSize:9},status:{paddingHorizontal:8,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:colors.success},attention:{borderColor:colors.warning},urgent:{borderColor:colors.danger},statusText:{color:colors.textMuted,fontSize:8,fontWeight:'900'},empty:{color:colors.textMuted,fontSize:11,textAlign:'center',paddingVertical:20},editor:{gap:11,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},editorTitle:{color:colors.cream,fontSize:18,fontWeight:'900'},label:{color:colors.textMuted,fontSize:10,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,0.10)'},chipText:{color:colors.textMuted,fontSize:9,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},notes:{minHeight:90,paddingTop:12,textAlignVertical:'top'} });
