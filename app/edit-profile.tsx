import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

export default function EditProfileScreen() {
  const { member, updateProfile } = useApp();
  const [name, setName] = useState(member?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(member?.whatsapp ?? '');
  const [lodge, setLodge] = useState(member?.lodge === 'Loja a confirmar' ? '' : member?.lodge ?? '');
  const [lodgeNumber, setLodgeNumber] = useState(member?.lodgeNumber ?? '');
  const [obedience, setObedience] = useState(member?.obedience ?? '');
  const [city, setCity] = useState(member?.city ?? '');
  const [region, setRegion] = useState(member?.region ?? '');
  const [eventEmailOptIn, setEventEmailOptIn] = useState(Boolean(member?.eventEmailOptIn));
  const [saving, setSaving] = useState(false);

  if (!member) return null;

  const save = async () => {
    if (!name.trim() || !whatsapp.trim() || !lodge.trim() || !city.trim() || region.trim().length < 2) {
      Alert.alert('Dados incompletos', 'Preencha nome, WhatsApp, Loja Maçônica, cidade e estado.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name,
        whatsapp,
        lodge,
        lodgeNumber,
        obedience,
        city,
        region,
        eventEmailOptIn,
      });
      Alert.alert('Perfil atualizado', 'Seus dados maçônicos e preferências foram salvos.');
      router.back();
    } catch (error) {
      Alert.alert('Não foi possível salvar', friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="PERFIL"
        title="Dados maçônicos e eventos"
        subtitle="Esses dados identificam você nas mensagens comerciais e definem os eventos exibidos para sua região."
      />

      <View style={styles.form}>
        <FormField label="Nome completo" value={name} onChangeText={setName} autoCapitalize="words" />
        <FormField label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
        <FormField label="Loja Maçônica" value={lodge} onChangeText={setLodge} autoCapitalize="words" />
        <FormField label="Número da Loja" value={lodgeNumber} onChangeText={setLodgeNumber} keyboardType="number-pad" />
        <FormField label="Potência / Obediência" value={obedience} onChangeText={setObedience} autoCapitalize="characters" placeholder="Ex.: GOSP" />
        <FormField label="Oriente / Cidade" value={city} onChangeText={setCity} autoCapitalize="words" />
        <FormField label="Estado" value={region} onChangeText={setRegion} autoCapitalize="characters" maxLength={2} placeholder="SC" />

        <View style={styles.preference}>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>Eventos por e-mail</Text>
            <Text style={styles.preferenceText}>Receber somente eventos aprovados que correspondam à sua cidade, região ou estado.</Text>
          </View>
          <Switch value={eventEmailOptIn} onValueChange={setEventEmailOptIn} trackColor={{ true: colors.gold }} />
        </View>

        <Button label="Salvar alterações" onPress={() => void save()} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  form: { gap: 17 },
  preference: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  preferenceCopy: { flex: 1, gap: 5 },
  preferenceTitle: { color: colors.cream, fontSize: 15, fontWeight: '800' },
  preferenceText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
