import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { addGoal, addProject, ensureAnnualPlan, loadAnnualPlan } from '@/lib/solRepository';
import { colors } from '@/theme/colors';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ManagerPlanningScreen() {
  const { lodge } = useApp();
  const year = new Date().getFullYear();
  const [planId, setPlanId] = useState<string | null>(null);
  const [vision, setVision] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDue, setProjectDue] = useState('');
  const [goals, setGoals] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!lodge) return;
    loadAnnualPlan(lodge.id, year).then((data) => {
      if (!data) return;
      setPlanId(data.plan.id); setVision(data.plan.vision ?? ''); setGoals(data.goals); setProjects(data.projects);
    }).catch(() => undefined);
  }, [lodge?.id, year]);

  const preparePlan = async () => {
    if (!lodge) return;
    try { const plan = await ensureAnnualPlan(lodge.id, year, vision); if (plan) setPlanId(plan.id); Alert.alert('Plano anual ativo', `Planejamento ${year} preparado.`); } catch { Alert.alert('Não foi possível sincronizar', 'O plano permanece disponível no modo local até o backend responder.'); }
  };
  const createGoal = async () => {
    if (!goalTitle.trim()) return;
    if (!planId) { Alert.alert('Ative o plano anual primeiro'); return; }
    const local = { id: `goal-${Date.now()}`, title: goalTitle.trim(), metric: goalMetric.trim(), target_value: Number(goalTarget) || null, current_value: 0, status: 'ACTIVE' };
    setGoals((current) => [...current, local]); setGoalTitle(''); setGoalMetric(''); setGoalTarget('');
    try { const remote = await addGoal(planId, local.title, local.metric, local.target_value ?? undefined); if (remote) setGoals((current) => current.map((item) => item.id === local.id ? remote : item)); } catch {}
  };
  const createProject = async () => {
    if (!projectTitle.trim()) return;
    if (!planId) { Alert.alert('Ative o plano anual primeiro'); return; }
    const local = { id: `project-${Date.now()}`, title: projectTitle.trim(), due_date: projectDue || null, status: 'PLANNED' };
    setProjects((current) => [...current, local]); setProjectTitle(''); setProjectDue('');
    try { const remote = await addProject(planId, local.title, local.due_date ?? undefined); if (remote) setProjects((current) => current.map((item) => item.id === local.id ? remote : item)); } catch {}
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR PRO</Text><Text style={styles.title}>Planejamento {year}</Text><Text style={styles.subtitle}>Objetivos, metas, responsáveis e projetos em um único plano para evitar gestões improvisadas.</Text></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Direção da gestão</Text><TextInput value={vision} onChangeText={setVision} multiline placeholder="Ex.: aumentar frequência, reduzir inadimplência e fortalecer a instrução" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} /><Button label={planId ? 'Atualizar plano' : 'Ativar plano anual'} onPress={preparePlan} /></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Nova meta</Text><TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="Objetivo" placeholderTextColor={colors.textMuted} style={styles.input} /><View style={styles.row}><TextInput value={goalMetric} onChangeText={setGoalMetric} placeholder="Indicador" placeholderTextColor={colors.textMuted} style={[styles.input, styles.flex]} /><TextInput value={goalTarget} onChangeText={setGoalTarget} placeholder="Meta" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[styles.input, styles.flex]} /></View><Button label="Adicionar meta" onPress={createGoal} /></View>
    <View style={styles.list}><Text style={styles.sectionTitle}>Metas</Text>{goals.map((goal) => <View key={goal.id} style={styles.item}><Text style={styles.itemTitle}>{goal.title}</Text><Text style={styles.itemText}>{goal.metric || 'Indicador a definir'}{goal.target_value != null ? ` · meta ${goal.target_value}` : ''}</Text></View>)}</View>
    <View style={styles.card}><Text style={styles.cardTitle}>Novo projeto</Text><TextInput value={projectTitle} onChangeText={setProjectTitle} placeholder="Projeto" placeholderTextColor={colors.textMuted} style={styles.input} /><TextInput value={projectDue} onChangeText={setProjectDue} placeholder="Prazo AAAA-MM-DD" placeholderTextColor={colors.textMuted} style={styles.input} /><Button label="Adicionar projeto" onPress={createProject} /></View>
    <View style={styles.list}><Text style={styles.sectionTitle}>Projetos</Text>{projects.map((project) => <View key={project.id} style={styles.item}><Text style={styles.itemTitle}>{project.title}</Text><Text style={styles.itemText}>{project.status === 'DONE' ? 'Concluído' : project.status === 'IN_PROGRESS' ? 'Em andamento' : 'Planejado'}{project.due_date ? ` · até ${new Date(`${project.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</Text></View>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({ content: { paddingTop: 22, gap: 18 }, header: { gap: 6 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: colors.cream, fontSize: 28, fontWeight: '900' }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 }, card: { gap: 11, padding: 16, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' }, input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 13 }, multiline: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' }, row: { flexDirection: 'row', gap: 8 }, flex: { flex: 1 }, list: { gap: 9 }, sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' }, item: { padding: 13, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 3 }, itemTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, itemText: { color: colors.textMuted, fontSize: 10 } });
