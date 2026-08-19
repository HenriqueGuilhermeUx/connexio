import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme/colors';
import { LodgeRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const roles: Array<{ value: Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>; label: string }> = [
  { value: 'WORSHIPFUL_MASTER', label: 'Venerável Mestre' },
  { value: 'SECRETARY', label: 'Secretário' },
  { value: 'TREASURER', label: 'Tesoureiro' },
];

export default function ManagerOnboardingScreen() {
  const { member, managementRequests, submitManagementRequest } = useApp();
  const [lodgeName, setLodgeName] = useState(member?.lodge?.replace(/ nº .*/, '') ?? '');
  const [lodgeNumber, setLodgeNumber] = useState('');
  const [orient, setOrient] = useState(member?.city ?? '');
  const [region, setRegion] = useState(member?.region ?? '');
  const [role, setRole] = useState<Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>>('WORSHIPFUL_MASTER');
  const [evidenceName, setEvidenceName] = useState('');
  const [notes, setNotes] = useState('');

  const latest = useMemo(
    () => managementRequests.find((request) => request.requesterId === member?.id),
    [managementRequests, member?.id],
  );

  const chooseEvidence = () => {
    setEvidenceName('termo-de-posse-ou-nomeacao.pdf');
    Alert.alert('Documento selecionado', 'No backend, este arquivo será enviado para armazenamento seguro e ficará disponível apenas para análise administrativa.');
  };

  const submit = () => {
    if (!lodgeName.trim() || !orient.trim() || !region.trim() || !evidenceName) {
      Alert.alert('Preencha os dados obrigatórios', 'Informe Loja, Oriente, região e anexe o documento de comprovação.');
      return;
    }

    submitManagementRequest({
      lodgeName: lodgeName.trim(),
      lodgeNumber: lodgeNumber.trim() || undefined,
      orient: orient.trim(),
      region: region.trim(),
      requestedRole: role,
      evidenceName,
      evidenceType: 'POSSESSION_TERM',
      notes: notes.trim() || undefined,
    });
    Alert.alert('Solicitação enviada', 'Sua comprovação entrou na fila administrativa do Connexio.');
    router.back();
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTÃO DA LOJA</Text>
        <Text style={styles.title}>Cadastrar ou assumir uma Loja</Text>
        <Text style={styles.subtitle}>O acesso de gestão é individual. Envie uma comprovação de posse ou nomeação para análise do Connexio.</Text>
      </View>

      {latest ? (
        <View style={styles.statusCard}>
          <Feather name={latest.status === 'PENDING' ? 'clock' : latest.status === 'APPROVED' ? 'check-circle' : 'x-circle'} size={20} color={colors.gold} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Última solicitação: {statusLabel(latest.status)}</Text>
            <Text style={styles.statusText}>{latest.lodgeName} · {roleLabel(latest.requestedRole)}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.form}>
        <Field label="Nome da Loja *" value={lodgeName} onChangeText={setLodgeName} placeholder="Ex.: ARLS Fraternidade" />
        <Field label="Número" value={lodgeNumber} onChangeText={setLodgeNumber} placeholder="Ex.: 123" keyboardType="number-pad" />
        <Field label="Oriente *" value={orient} onChangeText={setOrient} placeholder="Cidade" />
        <Field label="Região *" value={region} onChangeText={setRegion} placeholder="Região / estado" />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Cargo a validar *</Text>
          <View style={styles.roleList}>
            {roles.map((item) => (
              <Pressable key={item.value} onPress={() => setRole(item.value)} style={[styles.roleChip, role === item.value && styles.roleChipActive]}>
                <Text style={[styles.roleText, role === item.value && styles.roleTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Comprovação *</Text>
          <Pressable onPress={chooseEvidence} style={styles.uploadBox}>
            <Feather name={evidenceName ? 'file-text' : 'upload-cloud'} size={22} color={colors.gold} />
            <View style={styles.uploadCopy}>
              <Text style={styles.uploadTitle}>{evidenceName || 'Anexar termo de posse ou nomeação'}</Text>
              <Text style={styles.uploadHint}>PDF ou imagem. Neste protótipo simulamos a seleção do arquivo.</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Informações úteis para a análise" placeholderTextColor={colors.textMuted} style={[styles.input, styles.notes]} />
        </View>
      </View>

      <Button label="Enviar para análise" onPress={submit} />
      <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} /></View>;
}

function statusLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return status === 'PENDING' ? 'aguardando análise' : status === 'APPROVED' ? 'aprovada' : 'rejeitada';
}

function roleLabel(role: LodgeRole) {
  if (role === 'WORSHIPFUL_MASTER') return 'Venerável Mestre';
  if (role === 'SECRETARY') return 'Secretário';
  if (role === 'TREASURER') return 'Tesoureiro';
  return 'Membro';
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 20 },
  header: { gap: 7 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.cream, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  statusCard: { flexDirection: 'row', gap: 11, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  statusCopy: { flex: 1, gap: 2 },
  statusTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  statusText: { color: colors.textMuted, fontSize: 11 },
  form: { gap: 15 },
  fieldGroup: { gap: 7 },
  label: { color: colors.text, fontSize: 12, fontWeight: '700' },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 14, fontSize: 14 },
  notes: { minHeight: 100, paddingTop: 13, textAlignVertical: 'top' },
  roleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 9 },
  roleChipActive: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.12)' },
  roleText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  roleTextActive: { color: colors.goldSoft },
  uploadBox: { minHeight: 82, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.06)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadCopy: { flex: 1, gap: 3 },
  uploadTitle: { color: colors.text, fontSize: 12, fontWeight: '700' },
  uploadHint: { color: colors.textMuted, fontSize: 10, lineHeight: 15 },
});
