import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { refreshOperationalTasks } from '@/lib/solPeopleRepository';
import { createManagementTask, loadTodayTasks, setManagementTaskDone } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Task = { id: string; title: string; status: 'OPEN' | 'DONE'; due_at?: string | null; source?: string };
const fallback: Task[] = [
  { id: 'today-1', title: 'Preparar pauta da próxima sessão', status: 'OPEN', source: 'SESSION' },
  { id: 'today-2', title: 'Revisar cobranças em atraso', status: 'OPEN', source: 'FINANCE' },
  { id: 'today-3', title: 'Acompanhar irmãos que precisam de proximidade', status: 'OPEN', source: 'MEMBER_FOLLOWUP' },
];

export default function ManagerTodayScreen() {
  const { lodge } = useApp();
  const [tasks, setTasks] = useState<Task[]>(fallback);
  const [title, setTitle] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const reload = async () => {
    if (!lodge) return;
    setRefreshing(true);
    try {
      await refreshOperationalTasks(lodge.id);
      const rows = await loadTodayTasks(lodge.id);
      if (rows) setTasks(rows as Task[]);
    } catch {
      // O fallback permite demonstrar o conceito sem fingir sincronização.
    } finally { setRefreshing(false); }
  };
  useEffect(() => { void reload(); }, [lodge?.id]);

  const add = async () => {
    if (!title.trim()) return;
    const local: Task = { id: `task-${Date.now()}`, title: title.trim(), status: 'OPEN', source: 'MANUAL' };
    setTasks((current) => [local, ...current]);
    setTitle('');
    if (lodge) {
      try {
        const remote = await createManagementTask(lodge.id, local.title);
        if (remote) setTasks((current) => current.map((item) => item.id === local.id ? remote as Task : item));
      } catch { Alert.alert('Tarefa mantida na tela', 'A sincronização não foi concluída agora.'); }
    }
  };

  const toggle = (task: Task) => {
    const done = task.status !== 'DONE';
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: done ? 'DONE' : 'OPEN' } : item));
    if (!task.id.startsWith('today-') && !task.id.startsWith('task-')) void setManagementTaskDone(task.id, done).catch(() => undefined);
  };

  const open = tasks.filter((task) => task.status !== 'DONE');
  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>SISTEMA OPERACIONAL DA LOJA</Text><Text style={styles.title}>Hoje na Loja</Text><Text style={styles.subtitle}>O gestor não precisa lembrar de tudo. O Connexio cruza cobranças, obrigações, sessões, acompanhamento e planejamento para mostrar onde agir.</Text></View>
    <View style={styles.summary}><Feather name="activity" size={22} color={colors.gold}/><View style={styles.flex}><Text style={styles.summaryValue}>{open.length}</Text><Text style={styles.summaryText}>ações pendentes</Text></View><Pressable onPress={() => void reload()} style={styles.refresh}><Feather name="refresh-cw" size={17} color={colors.gold}/><Text style={styles.refreshText}>{refreshing?'Atualizando':'Atualizar'}</Text></Pressable></View>
    <View style={styles.addCard}><TextInput value={title} onChangeText={setTitle} placeholder="Nova ação ou pendência" placeholderTextColor={colors.textMuted} style={styles.input}/><Button label="Adicionar" onPress={()=>void add()}/></View>
    <View style={styles.list}>{tasks.map((task)=><Pressable key={task.id} onPress={()=>toggle(task)} style={[styles.task,task.status==='DONE'&&styles.done]}><Feather name={task.status==='DONE'?'check-circle':'circle'} size={20} color={task.status==='DONE'?colors.success:colors.gold}/><View style={styles.taskCopy}><Text style={[styles.taskTitle,task.status==='DONE'&&styles.doneText]}>{task.title}</Text><Text style={styles.taskMeta}>{sourceLabel(task.source)}{task.due_at?` · ${new Date(task.due_at).toLocaleDateString('pt-BR')}`:''}</Text></View></Pressable>)}</View>
  </Screen>;
}

function sourceLabel(source?:string){if(source==='FINANCE')return'Tesouraria';if(source==='SESSION')return'Sessão';if(source==='MEMBER_FOLLOWUP')return'Acompanhamento';if(source==='PLAN')return'Planejamento';if(source==='OBLIGATION')return'Obrigação';return'Gestão';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:28,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},summary:{flexDirection:'row',alignItems:'center',gap:12,padding:16,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},summaryValue:{color:colors.cream,fontSize:22,fontWeight:'900'},summaryText:{color:colors.textMuted,fontSize:11},refresh:{flexDirection:'row',gap:6,alignItems:'center',padding:8},refreshText:{color:colors.goldSoft,fontSize:9,fontWeight:'800'},addCard:{gap:10,padding:14,borderRadius:18,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},list:{gap:9},task:{flexDirection:'row',alignItems:'center',gap:11,padding:14,borderRadius:16,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},done:{opacity:.6},taskCopy:{flex:1,gap:3},taskTitle:{color:colors.text,fontSize:13,fontWeight:'800'},doneText:{textDecorationLine:'line-through'},taskMeta:{color:colors.textMuted,fontSize:10}});
