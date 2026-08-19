import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { createLearningItem, loadLearningItems, seedLearningPath } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const audiences = ['APPRENTICE','COMPANION','MASTER','LEADERSHIP','ALL'] as const;
type Audience = typeof audiences[number];

export default function ManagerEducationScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('APPRENTICE');

  const reload = () => { if (lodge) void loadLearningItems(lodge.id).then(setItems).catch(() => undefined); };
  useEffect(reload, [lodge?.id]);
  const groups = useMemo(() => audiences.map((value) => ({ value, items: items.filter((item) => item.audience === value) })).filter((group) => group.items.length), [items]);

  const seed = async () => {
    if (!lodge) return;
    try { const count = await seedLearningPath(lodge.id); reload(); Alert.alert('Trilha preparada', `${count} item(ns) padrão foram incluídos sem duplicar o que já existia.`); }
    catch (error) { Alert.alert('Não foi possível preparar a trilha', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  const add = async () => {
    if (!lodge || !title.trim()) { Alert.alert('Informe o título da atividade'); return; }
    try { await createLearningItem(lodge.id, { title: title.trim(), audience, description: description.trim() || undefined }); setTitle(''); setDescription(''); reload(); }
    catch (error) { Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · CONHECIMENTO</Text><Text style={styles.title}>Educação & formação de lideranças</Text><Text style={styles.subtitle}>Organize a formação por etapa e crie continuidade para Aprendizes, Companheiros, Mestres e futuros gestores.</Text></View>
    <View style={styles.callout}><Feather name="book-open" size={20} color={colors.gold}/><View style={styles.flex}><Text style={styles.calloutTitle}>Trilha inicial pronta para usar</Text><Text style={styles.calloutText}>O Connexio pode criar uma base com simbolismo, história, direitos/deveres, filosofia, gestão, planejamento, finanças e liderança.</Text></View><Button label="Criar trilha" onPress={() => void seed()} style={styles.smallButton}/></View>

    <View style={styles.form}><Text style={styles.formTitle}>Adicionar formação</Text><TextInput value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.textMuted} style={styles.input}/><Text style={styles.label}>Público</Text><View style={styles.chips}>{audiences.map((value)=><Pressable key={value} onPress={()=>setAudience(value)} style={[styles.chip,audience===value&&styles.chipActive]}><Text style={[styles.chipText,audience===value&&styles.chipTextActive]}>{audienceLabel(value)}</Text></Pressable>)}</View><TextInput value={description} onChangeText={setDescription} multiline placeholder="Objetivo ou conteúdo" placeholderTextColor={colors.textMuted} style={[styles.input,styles.notes]}/><Button label="Adicionar à trilha" onPress={()=>void add()}/></View>

    {groups.map((group)=><View key={group.value} style={styles.section}><Text style={styles.sectionTitle}>{audienceLabel(group.value)}</Text>{group.items.map((item:any)=><View key={item.id} style={styles.item}><View style={styles.icon}><Feather name={item.category==='LEADERSHIP'?'award':'book'} size={18} color={colors.gold}/></View><View style={styles.flex}><Text style={styles.itemTitle}>{item.title}</Text>{item.description?<Text style={styles.meta}>{item.description}</Text>:null}</View></View>)}</View>)}
    {!items.length ? <Text style={styles.empty}>Crie a trilha inicial para começar o programa de educação da Loja.</Text> : null}
  </Screen>;
}

function audienceLabel(value:string){const map:Record<string,string>={APPRENTICE:'Aprendizes',COMPANION:'Companheiros',MASTER:'Mestres',LEADERSHIP:'Formação de lideranças',ALL:'Todos os irmãos'};return map[value]??value;}
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},callout:{flexDirection:'row',alignItems:'center',gap:11,padding:14,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},flex:{flex:1,gap:3},calloutTitle:{color:colors.text,fontSize:12,fontWeight:'900'},calloutText:{color:colors.textMuted,fontSize:9,lineHeight:14},smallButton:{minHeight:40,paddingHorizontal:12},form:{gap:11,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},formTitle:{color:colors.text,fontSize:15,fontWeight:'900'},label:{color:colors.textMuted,fontSize:9,fontWeight:'800'},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},notes:{minHeight:80,paddingTop:12,textAlignVertical:'top'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6},chip:{paddingHorizontal:9,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,0.10)'},chipText:{color:colors.textMuted,fontSize:8,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},section:{gap:8},sectionTitle:{color:colors.cream,fontSize:15,fontWeight:'900'},item:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:15,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},icon:{width:38,height:38,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},itemTitle:{color:colors.text,fontSize:12,fontWeight:'800'},meta:{color:colors.textMuted,fontSize:9,lineHeight:14},empty:{color:colors.textMuted,fontSize:11,textAlign:'center',paddingVertical:20}});
