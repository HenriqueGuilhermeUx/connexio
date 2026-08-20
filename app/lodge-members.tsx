import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { persistLodgeInvitation, persistLodgeMemberRole } from '@/lib/lodgeMembersRepository';
import { colors } from '@/theme/colors';
import { LodgeRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const assignableRoles: LodgeRole[] = ['MEMBER', 'SECRETARY', 'TREASURER'];

export default function LodgeMembersScreen() {
  const { lodge, lodgeMembers, addLodgeMember, updateLodgeMemberRole } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<LodgeRole>('MEMBER');
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Dados obrigatórios', 'Informe nome e e-mail do membro.');
      return;
    }

    setLoading(true);
    try {
      if (lodge) {
        await persistLodgeInvitation(lodge.id, {
          name: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.trim() || undefined,
          role,
        });
      }
      addLodgeMember({ name: name.trim(), email: email.trim(), whatsapp: whatsapp.trim() || undefined, role });
      setName('');
      setEmail('');
      setWhatsapp('');
      setRole('MEMBER');
      Alert.alert('Convite criado', 'O irmão foi incluído na lista. No modo conectado, o vínculo será ativado quando ele entrar com o e-mail convidado.');
    } catch (error) {
      Alert.alert('Não foi possível convidar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (memberId: string, currentRole: LodgeRole) => {
    const roleToSet = nextRole(currentRole);
    try {
      if (lodge) await persistLodgeMemberRole(lodge.id, memberId, roleToSet);
      updateLodgeMemberRole(memberId, roleToSet);
    } catch (error) {
      Alert.alert('Não foi possível alterar o cargo', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MEMBROS</Text>
        <Text style={styles.title}>{lodge?.name ?? 'Sua Loja'}</Text>
        <Text style={styles.subtitle}>{lodgeMembers.length} vínculos cadastrados</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Convidar membro</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        <TextInput value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp (opcional)" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" style={styles.input} />
        <View style={styles.roles}>
          {assignableRoles.map((item) => (
            <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleChip, role === item && styles.roleChipActive]}>
              <Text style={[styles.roleText, role === item && styles.roleTextActive]}>{roleLabel(item)}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="Convidar para a Loja" loading={loading} onPress={() => void add()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membros cadastrados</Text>
        {lodgeMembers.map((item) => (
          <View key={item.id} style={styles.memberCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
            <View style={styles.memberCopy}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberMeta}>{item.email}</Text>
              <Text style={styles.memberRole}>{roleLabel(item.role)} · {item.status === 'ACTIVE' ? 'Ativo' : item.status === 'PENDING' ? 'Pendente' : 'Inativo'}</Text>
            </View>
            {item.role !== 'WORSHIPFUL_MASTER' ? (
              <Pressable accessibilityRole="button" onPress={() => void changeRole(item.id, item.role)} style={styles.roleButton}>
                <Feather name="repeat" size={15} color={colors.gold} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.importCard}>
        <Feather name="file-text" size={21} color={colors.gold} />
        <View style={styles.importCopy}>
          <Text style={styles.importTitle}>Importação por planilha</Text>
          <Text style={styles.importText}>Próxima etapa: CSV/XLSX para o Secretário cadastrar dezenas de irmãos de uma vez.</Text>
        </View>
      </View>

      <Button label="Voltar ao Gestor" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function nextRole(role: LodgeRole): LodgeRole {
  if (role === 'MEMBER') return 'SECRETARY';
  if (role === 'SECRETARY') return 'TREASURER';
  return 'MEMBER';
}

function roleLabel(role: LodgeRole) {
  if (role === 'WORSHIPFUL_MASTER') return 'Venerável Mestre';
  if (role === 'SECRETARY') return 'Secretário';
  if (role === 'TREASURER') return 'Tesoureiro';
  return 'Membro';
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 },
  header: { gap: 5 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.cream, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12 },
  formCard: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 13, fontSize: 13 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8 },
  roleChipActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.12)' },
  roleText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  roleTextActive: { color: colors.goldSoft },
  section: { gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.cream, fontSize: 16, fontWeight: '900' },
  memberCopy: { flex: 1, gap: 2 },
  memberName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  memberMeta: { color: colors.textMuted, fontSize: 10 },
  memberRole: { color: colors.goldSoft, fontSize: 10, fontWeight: '700' },
  roleButton: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  importCard: { flexDirection: 'row', gap: 11, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  importCopy: { flex: 1, gap: 3 },
  importTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  importText: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
