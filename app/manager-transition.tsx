import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { loadHandover, seedHandover, setHandoverDone } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ManagerTransitionScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const reload = () => { if (lodge) void loadHandover(lodge.id).then(setItems).catch(() => undefined); };
  useEffect(reload, [lodge?.id]);
  const done = useMemo(() => items.filter((item) => item.status === 'DONE').length, [items]);

  const prepare = async () => {
    if (!lodge) return;
    try { const count = await seedHandover(lodge.id); reload(); Alert.alert('Transição preparada', `${count} item(ns) padrão adicionados sem duplicação.`); }
    catch (error) { Alert.alert('Não foi possível preparar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };
  const toggle = async (item:any) => {
    const next = item.status !== 'DONE';
    try { await setHandoverDone(item.id, next); setItems((current)=>current.map((row)=>row.id===item.id?{...row,status:next?'DONE':'OPEN'}:row)); }
    catch (error) { Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.'); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO · CONTINUIDADE</Text><Text style={styles.title}>Transição de gestão</Text><Text style={styles.subtitle}>Preserve memória, documentos, acessos, situação financeira, patrimônio, pessoas e projetos para a próxima administração.</Text></View>
    <View style={styles.progress}><View style={styles.progressCopy}><Text style={styles.progressValue}>{done}/{items.length || 0}</Text><Text style={styles.progressText}>itens concluídos</Text></View><Button label={items.length?'Revisar checklist':'Preparar checklist'} onPress={()=>void prepare()} style={styles.smallButton}/></View>

    <View style={styles.list}>{items.map((item)=><Pressable key={item.id} onPress={()=>void toggle(item)} style={[styles.card,item.status==='DONE'&&styles.doneCard]}><View style={styles.check}><Feather name={item.status==='DONE'?'check':'square'} size={18} color={item.status==='DONE'?colors.success:colors.gold}/></View><View style={styles.flex}><Text style={styles.titleItem}>{item.title}</Text><Text style={styles.meta}>{categoryLabel(item.category)}{item.responsible_role?` · ${roleLabel(item.responsible_role)}`:''}{item.due_date?` · até ${new Date(`${item.due_date}T12:00:00`).toLocaleDateString('pt-BR')}`:''}</Text>{item.notes?<Text style={styles.notes}>{item.notes}</Text>:null}</View></Pressable>)}</View>
    {!items.length?<View style={styles.empty}><Feather name="repeat" size={26} color={colors.gold}/><Text style={styles.emptyTitle}>A Loja ainda não tem checklist de transição</Text><Text style={styles.emptyText}>O modelo inicial cobre secretaria, finanças, patrimônio, acessos, pessoas e projetos.</Text></View>:null}
  </Screen>;
}

function categoryLabel(value:string){const map:Record<string,string>={SECRETARIAT:'Secretaria',FINANCE:'Finanças',PATRIMONY:'Patrimônio',ACCESS:'Acessos',PEOPLE:'Pessoas',PROJECTS:'Projetos'};return map[value]??value;}
function roleLabel(value:string){return value==='SECRETARY'?'Secretário':value==='TREASURER'?'Tesoureiro':'Venerável';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},progress:{flexDirection:'row',alignItems:'center',gap:12,padding:15,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},progressCopy:{flex:1},progressValue:{color:colors.cream,fontSize:24,fontWeight:'900'},progressText:{color:colors.textMuted,fontSize:10},smallButton:{minHeight:42},list:{gap:9},card:{flexDirection:'row',gap:10,alignItems:'center',padding:13,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},doneCard:{opacity:.65},check:{width:38,height:38,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:3},titleItem:{color:colors.text,fontSize:12,fontWeight:'800'},meta:{color:colors.textMuted,fontSize:9},notes:{color:colors.textMuted,fontSize:10,lineHeight:14},empty:{alignItems:'center',gap:7,padding:24,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyTitle:{color:colors.text,fontSize:13,fontWeight:'900'},emptyText:{color:colors.textMuted,fontSize:10,lineHeight:15,textAlign:'center'}});
