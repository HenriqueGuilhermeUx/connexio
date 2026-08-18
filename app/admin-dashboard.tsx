import { useApp } from '@/context/AppContext';
import { loadAdminMemberQueue, reviewMember } from '@/lib/catalog';
import { friendlyError } from '@/lib/errors';
import { colors } from '@/theme/colors';
import { AdminMemberQueueRecord } from '@/types/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type MemberWithLodge = AdminMemberQueueRecord & {
  lodge_name?: string | null;
  lodge_number?: string | null;
  obedience?: string | null;
};

function text(value: unknown) {
  return String(value ?? '').trim();
}

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 820;
  const { member, sessionLoading, dataLoading, isAdmin, login, logout, refreshData } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [queue, setQueue] = useState<MemberWithLodge[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<{ id: string; decision: 'APPROVED' | 'REJECTED' } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      setQueue((await loadAdminMemberQueue()) as MemberWithLodge[]);
    } catch (error) {
      Alert.alert('Não foi possível carregar os cadastros', friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return queue;
    return queue.filter((item) => [
      item.full_name,
      item.email,
      item.phone,
      item.cim_number,
      item.city,
      item.region,
      item.lodge_name,
      item.lodge_number,
      item.obedience,
    ].some((value) => text(value).toLocaleLowerCase('pt-BR').includes(term)));
  }, [query, queue]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Preencha seus dados', 'Informe e-mail e senha do administrador.');
      return;
    }
    setLoginLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Não foi possível entrar', friendlyError(error, 'Confira seu e-mail e senha.'));
    } finally {
      setLoginLoading(false);
    }
  };

  const decide = async (record: MemberWithLodge, decision: 'APPROVED' | 'REJECTED') => {
    setBusy({ id: record.id, decision });
    try {
      await reviewMember(record.id, decision, reasons[record.id] ?? '');
      await Promise.all([load(), refreshData()]);
      Alert.alert(decision === 'APPROVED' ? 'Membro aprovado' : 'Cadastro rejeitado', record.full_name);
    } catch (error) {
      Alert.alert('Não foi possível registrar a decisão', friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  if (sessionLoading) {
    return <Loading label="Carregando sessão administrativa..." />;
  }

  if (!member) {
    return (
      <ScrollView contentContainerStyle={styles.loginPage}>
        <View style={styles.loginCard}>
          <Text style={styles.kicker}>CONNEXIO · OPERAÇÃO</Text>
          <Text style={styles.loginTitle}>Dashboard administrativo</Text>
          <Text style={styles.subtitle}>Validação de membros da rede em um painel próprio para computador.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="seu@email.com"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              placeholder="Sua senha"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              onSubmitEditing={() => void handleLogin()}
            />
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void handleLogin()} disabled={loginLoading}>
            {loginLoading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </Pressable>
          <Text style={styles.security}>O Supabase só libera esta tela para usuários cadastrados como administradores.</Text>
        </View>
      </ScrollView>
    );
  }

  if (dataLoading) return <Loading label="Verificando permissão administrativa..." />;

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Acesso restrito</Text>
        <Text style={styles.subtitle}>Esta conta não possui permissão administrativa.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => void logout()}>
          <Text style={styles.secondaryButtonText}>Sair</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>CONNEXIO · ADMIN</Text>
            <Text style={styles.title}>Validação de entrantes</Text>
            <Text style={styles.subtitle}>Aprove ou rejeite cadastros antes de liberar o acesso completo à rede.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.secondaryButton} onPress={() => void load()}>
              <Text style={styles.secondaryButtonText}>Atualizar</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => void logout()}>
              <Text style={styles.ghostButtonText}>Sair</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.stats, compact && styles.statsCompact]}>
          <Stat value={queue.length} label="Aguardando validação" />
          <Stat value={filtered.length} label="Exibidos na busca" />
          <Stat value={member.name ? 1 : 0} label="Admin conectado" />
        </View>

        <View style={styles.toolbar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome, CIM, Loja, cidade, e-mail..."
            placeholderTextColor={colors.textMuted}
            style={styles.search}
          />
        </View>

        {loading ? (
          <Loading label="Carregando fila de validação..." inline />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum cadastro pendente</Text>
            <Text style={styles.subtitle}>{query ? 'Nenhum resultado para esta busca.' : 'A fila está limpa no momento.'}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((record) => {
              const lodge = record.lodge_name
                ? `${record.lodge_name}${record.lodge_number ? ` nº ${record.lodge_number}` : ''}`
                : 'Não informada';
              return (
                <View key={record.id} style={styles.card}>
                  <View style={[styles.cardTop, compact && styles.cardTopCompact]}>
                    <View style={styles.identity}>
                      <Text style={styles.memberName}>{record.full_name || 'Membro Connexio'}</Text>
                      <Text style={styles.memberEmail}>{record.email}</Text>
                    </View>
                    <View style={styles.badge}><Text style={styles.badgeText}>PENDENTE</Text></View>
                  </View>

                  <View style={[styles.dataGrid, compact && styles.dataGridCompact]}>
                    <Data label="CIM" value={record.cim_number} />
                    <Data label="Loja" value={lodge} />
                    <Data label="Potência / Obediência" value={record.obedience || 'Não informada'} />
                    <Data label="Telefone" value={record.phone || 'Não informado'} />
                    <Data label="Oriente / Estado" value={[record.city, record.region].filter(Boolean).join(' · ') || 'Não informado'} />
                    <Data label="Cadastro" value={new Date(record.submitted_at).toLocaleString('pt-BR')} />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Observação / motivo da decisão</Text>
                    <TextInput
                      value={reasons[record.id] ?? ''}
                      onChangeText={(value) => setReasons((current) => ({ ...current, [record.id]: value }))}
                      placeholder="Ex.: CIM e Loja conferidos"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  <View style={[styles.actions, compact && styles.actionsCompact]}>
                    <Pressable
                      style={[styles.rejectButton, busy?.id === record.id && styles.disabled]}
                      disabled={busy?.id === record.id}
                      onPress={() => void decide(record, 'REJECTED')}
                    >
                      {busy?.id === record.id && busy.decision === 'REJECTED'
                        ? <ActivityIndicator color={colors.danger} />
                        : <Text style={styles.rejectText}>Rejeitar</Text>}
                    </Pressable>
                    <Pressable
                      style={[styles.approveButton, busy?.id === record.id && styles.disabled]}
                      disabled={busy?.id === record.id}
                      onPress={() => void decide(record, 'APPROVED')}
                    >
                      {busy?.id === record.id && busy.decision === 'APPROVED'
                        ? <ActivityIndicator color={colors.background} />
                        : <Text style={styles.approveText}>Aprovar membro</Text>}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Loading({ label, inline = false }: { label: string; inline?: boolean }) {
  return (
    <View style={inline ? styles.loadingInline : styles.centered}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.subtitle}>{label}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { minHeight: '100%', backgroundColor: colors.background, padding: 24 },
  shell: { width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 22 },
  loginPage: { flexGrow: 1, minHeight: '100%', backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginCard: { width: '100%', maxWidth: 460, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 28, gap: 18 },
  centered: { flex: 1, minHeight: 520, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  loadingInline: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  loginTitle: { color: colors.cream, fontSize: 32, fontWeight: '900' },
  title: { color: colors.cream, fontSize: 34, fontWeight: '900' },
  deniedTitle: { color: colors.cream, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  security: { color: colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  fieldGroup: { gap: 7 },
  label: { color: colors.goldSoft, fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  primaryButton: { backgroundColor: colors.gold, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: colors.background, fontSize: 14, fontWeight: '900' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 },
  headerCompact: { flexDirection: 'column' },
  headerText: { flex: 1, gap: 6 },
  headerActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { borderWidth: 1, borderColor: colors.gold, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 11 },
  secondaryButtonText: { color: colors.goldSoft, fontWeight: '800' },
  ghostButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 11 },
  ghostButtonText: { color: colors.textMuted, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 14 },
  statsCompact: { flexDirection: 'column' },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 4 },
  statValue: { color: colors.goldSoft, fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  toolbar: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12 },
  search: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14 },
  list: { gap: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20, gap: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  cardTopCompact: { flexDirection: 'column' },
  identity: { flex: 1, gap: 3 },
  memberName: { color: colors.cream, fontSize: 20, fontWeight: '900' },
  memberEmail: { color: colors.textMuted, fontSize: 13 },
  badge: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.warning, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  badgeText: { color: colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dataGridCompact: { flexDirection: 'column' },
  dataItem: { minWidth: 230, flexGrow: 1, flexBasis: '30%', backgroundColor: colors.background, borderRadius: 12, padding: 13, gap: 4 },
  dataLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dataValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionsCompact: { flexDirection: 'column' },
  rejectButton: { borderWidth: 1, borderColor: colors.danger, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  rejectText: { color: colors.danger, fontWeight: '900' },
  approveButton: { backgroundColor: colors.gold, borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  approveText: { color: colors.background, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 34, alignItems: 'center', gap: 7 },
  emptyTitle: { color: colors.cream, fontSize: 18, fontWeight: '900' },
});
