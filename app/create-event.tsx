import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { PhotoPicker, SelectedPhoto } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { createEvent } from '@/lib/events';
import { friendlyError } from '@/lib/errors';
import { EventScope } from '@/types';
import { colors } from '@/theme/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const scopes: { value: EventScope; label: string; description: string }[] = [
  { value: 'CITY', label: 'Minha cidade', description: 'Exibido e enviado aos membros da cidade informada.' },
  { value: 'REGION', label: 'Minha região', description: 'Exibido e enviado aos membros do estado informado.' },
  { value: 'NETWORK', label: 'Toda a rede', description: 'Disponível para todos os membros do Connexio.' },
];

function parseBrazilDateTime(dateValue: string, timeValue: string) {
  const [day, month, year] = dateValue.split('/').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  if (![day, month, year, hour, minute].every(Number.isFinite)) return null;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) return null;
  return date;
}

export default function CreateEventScreen() {
  const { member } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(member?.city ?? '');
  const [region, setRegion] = useState(member?.region ?? '');
  const [lodgeName, setLodgeName] = useState(member?.lodge === 'Loja a confirmar' ? '' : member?.lodge ?? '');
  const [contactWhatsapp, setContactWhatsapp] = useState(member?.whatsapp ?? '');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [scope, setScope] = useState<EventScope>('REGION');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  if (!member || member.status !== 'APPROVED') {
    return <Screen><Text style={styles.blocked}>A divulgação de eventos é liberada para membros aprovados.</Text></Screen>;
  }

  const submit = async () => {
    if (!title.trim() || !description.trim() || !date.trim() || !time.trim() || !venue.trim() || !city.trim() || region.trim().length < 2 || !lodgeName.trim() || !contactWhatsapp.trim()) {
      Alert.alert('Evento incompleto', 'Preencha título, descrição, data, horário, local, cidade, estado, Loja e WhatsApp.');
      return;
    }

    const startsAt = parseBrazilDateTime(date.trim(), time.trim());
    if (!startsAt) {
      Alert.alert('Data ou horário inválido', 'Use uma data real no formato DD/MM/AAAA e horário HH:MM.');
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      Alert.alert('Data inválida', 'O evento precisa estar marcado para uma data futura.');
      return;
    }

    const price = ticketPrice.trim()
      ? Number(ticketPrice.replace(/\./g, '').replace(',', '.'))
      : undefined;
    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      Alert.alert('Valor inválido', 'Informe um valor válido ou deixe o campo vazio.');
      return;
    }

    setSaving(true);
    try {
      const id = await createEvent({
        title,
        description,
        startsAt: startsAt.toISOString(),
        venue,
        address,
        city,
        region,
        lodgeName,
        contactWhatsapp,
        ticketPrice: price,
        ticketUrl,
        audienceScope: scope,
      }, photos[0]);
      Alert.alert('Evento enviado', 'O evento será exibido após a aprovação administrativa.');
      router.replace({ pathname: '/event/[id]', params: { id } });
    } catch (error) {
      Alert.alert('Não foi possível enviar', friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="DIVULGAÇÃO"
        title="Cadastrar evento"
        subtitle="O evento passa por análise antes de aparecer no aplicativo e ser enviado por e-mail."
      />

      <View style={styles.form}>
        <FormField label="Título do evento *" value={title} onChangeText={setTitle} placeholder="Ex.: Jantar da Tainha 2026" />
        <FormField label="Descrição *" value={description} onChangeText={setDescription} multiline maxLength={2000} />
        <PhotoPicker photos={photos} onChange={(next) => setPhotos(next.slice(0, 1))} />
        <Text style={styles.photoHint}>Use uma imagem ou cartaz oficial. Para eventos, será utilizada somente uma imagem de capa.</Text>

        <View style={styles.row}>
          <View style={styles.flex}><FormField label="Data *" value={date} onChangeText={setDate} keyboardType="number-pad" placeholder="31/05/2026" /></View>
          <View style={styles.small}><FormField label="Horário *" value={time} onChangeText={setTime} keyboardType="number-pad" placeholder="20:00" /></View>
        </View>

        <FormField label="Local *" value={venue} onChangeText={setVenue} placeholder="Ex.: Clube do Zé" />
        <FormField label="Endereço" value={address} onChangeText={setAddress} />
        <View style={styles.row}>
          <View style={styles.flex}><FormField label="Cidade *" value={city} onChangeText={setCity} /></View>
          <View style={styles.small}><FormField label="Estado *" value={region} onChangeText={setRegion} autoCapitalize="characters" maxLength={2} /></View>
        </View>
        <FormField label="Loja organizadora *" value={lodgeName} onChangeText={setLodgeName} />
        <FormField label="WhatsApp da organização *" value={contactWhatsapp} onChangeText={setContactWhatsapp} keyboardType="phone-pad" />
        <FormField label="Valor do ingresso" value={ticketPrice} onChangeText={setTicketPrice} keyboardType="decimal-pad" placeholder="Ex.: 80,00" />
        <FormField label="Link para ingresso ou informações" value={ticketUrl} onChangeText={setTicketUrl} autoCapitalize="none" keyboardType="url" />

        <View style={styles.scopeBlock}>
          <Text style={styles.scopeTitle}>Alcance da divulgação</Text>
          {scopes.map((item) => (
            <Pressable key={item.value} onPress={() => setScope(item.value)} style={[styles.scopeOption, scope === item.value && styles.scopeSelected]}>
              <View style={[styles.radio, scope === item.value && styles.radioSelected]} />
              <View style={styles.scopeCopy}>
                <Text style={styles.scopeLabel}>{item.label}</Text>
                <Text style={styles.scopeDescription}>{item.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Antes do envio</Text>
          <Text style={styles.warningText}>Confirme data, horário, endereço e contato. Eventos publicados poderão gerar e-mails para membros que autorizaram esse tipo de comunicação.</Text>
        </View>

        <Button label="Enviar para aprovação" onPress={() => void submit()} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  form: { gap: 17 },
  blocked: { color: colors.cream, fontSize: 18, lineHeight: 26, textAlign: 'center', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1 },
  small: { width: 115 },
  photoHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: -8 },
  scopeBlock: { gap: 10 },
  scopeTitle: { color: colors.cream, fontSize: 15, fontWeight: '900' },
  scopeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  scopeSelected: { borderColor: colors.gold },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.textMuted },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  scopeCopy: { flex: 1, gap: 3 },
  scopeLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  scopeDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  warning: { gap: 5, padding: 15, borderRadius: 16, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  warningTitle: { color: colors.goldSoft, fontSize: 13, fontWeight: '900' },
  warningText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
