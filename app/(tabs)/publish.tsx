import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { categories } from '@/data/mock';
import { colors } from '@/theme/colors';
import { ListingType, PriceType } from '@/types';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const typeOptions: [ListingType, string][] = [
  ['BUSINESS', 'Loja / negócio'],
  ['SERVICE', 'Serviço'],
  ['PRODUCT', 'Produto'],
];

export default function PublishScreen() {
  const { member, createListing } = useApp();
  const [type, setType] = useState<ListingType>('SERVICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Advocacia');
  const [city, setCity] = useState(member?.city ?? '');
  const [region, setRegion] = useState(member?.region ?? '');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('ON_REQUEST');
  const [benefit, setBenefit] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState(member?.email ?? '');

  const submit = () => {
    if (!title.trim() || !description.trim() || !city.trim() || !region.trim()) {
      Alert.alert('Complete sua oferta', 'Informe título, descrição, cidade e região.');
      return;
    }

    const parsedPrice = Number(price.replace(/\./g, '').replace(',', '.'));
    if (priceType !== 'ON_REQUEST' && (!price || Number.isNaN(parsedPrice))) {
      Alert.alert('Confira o preço', 'Informe um valor válido ou selecione “Sob consulta”.');
      return;
    }

    const created = createListing({
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      city: city.trim(),
      region: region.trim(),
      price: priceType === 'ON_REQUEST' ? undefined : parsedPrice,
      priceType,
      benefit: benefit.trim() || undefined,
      website: website.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setBenefit('');
    setWebsite('');

    const pending = member?.status !== 'APPROVED';
    Alert.alert(
      pending ? 'Oferta salva com sucesso' : 'Oferta enviada para revisão',
      pending
        ? 'Registramos todas as informações. A oferta permanece privada e será encaminhada à revisão quando seu cadastro for aprovado.'
        : 'Sua oferta foi enviada para a moderação antes de aparecer no catálogo.',
      [{ text: 'Ver oferta', onPress: () => router.push({ pathname: '/listing/[id]', params: { id: created.id } }) }],
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>O QUE VOCÊ OFERECE?</Text>
        <Text style={styles.title}>Cadastre de forma fácil</Text>
        <Text style={styles.subtitle}>
          Preencha tudo agora. Mesmo durante a validação, nenhuma informação será perdida.
        </Text>
      </View>

      {member?.status !== 'APPROVED' ? (
        <View style={styles.pendingNotice}>
          <Feather name="lock" size={19} color={colors.warning} />
          <Text style={styles.pendingText}>Sua oferta ficará privada até a aprovação do seu cadastro e a revisão do conteúdo.</Text>
        </View>
      ) : null}

      <View style={styles.toggle}>
        {typeOptions.map(([value, label]) => (
          <Pressable key={value} onPress={() => setType(value)} style={[styles.toggleItem, type === value && styles.toggleSelected]}>
            <Text style={[styles.toggleText, type === value && styles.toggleTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.photoBox} onPress={() => Alert.alert('Fotos da oferta', 'O seletor de até 5 imagens será ativado na etapa de armazenamento.') }>
        <View style={styles.photoIcon}><Feather name="camera" size={24} color={colors.gold} /></View>
        <View style={styles.photoCopy}>
          <Text style={styles.photoTitle}>Adicionar fotos</Text>
          <Text style={styles.photoSubtitle}>Até 5 imagens · você poderá editar depois</Text>
        </View>
        <Feather name="plus" size={20} color={colors.textMuted} />
      </Pressable>

      <View style={styles.form}>
        <FormField label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Consultoria contábil para empresas" maxLength={120} />
        <FormField label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Explique o que você oferece, para quem e em quais condições." maxLength={1200} />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Segmento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {categories.filter((item) => item !== 'Todos').map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.pill, category === item && styles.pillSelected]}>
                <Text style={[styles.pillText, category === item && styles.pillTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FormField label="Cidade de atendimento" value={city} onChangeText={setCity} placeholder="Ex.: Santos" />
        <FormField label="Região" value={region} onChangeText={setRegion} placeholder="Ex.: Baixada Santista" />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preço</Text>
          <View style={styles.priceOptions}>
            {([['ON_REQUEST', 'Sob consulta'], ['FROM', 'A partir de'], ['FIXED', 'Valor fixo']] as [PriceType, string][]).map(([value, label]) => (
              <Pressable key={value} onPress={() => setPriceType(value)} style={[styles.priceOption, priceType === value && styles.priceOptionSelected]}>
                <Text style={[styles.priceOptionText, priceType === value && styles.priceOptionTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {priceType !== 'ON_REQUEST' ? <FormField label="Valor em reais" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0,00" /> : null}
        <FormField label="Benefício exclusivo (opcional)" value={benefit} onChangeText={setBenefit} placeholder="Ex.: 10% de desconto para membros" />
        <FormField label="Site ou rede social (opcional)" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="https://" />
        <FormField label="E-mail para contato" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="WhatsApp para contato" value={member?.whatsapp ?? ''} editable={false} hint="Para alterar, edite o telefone da sua conta." />
        <Button label={member?.status === 'APPROVED' ? 'Enviar para revisão' : 'Salvar minha oferta'} onPress={submit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 24 },
  intro: { gap: 8 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: colors.cream, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  pendingNotice: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 15, backgroundColor: 'rgba(241,200,107,0.08)', borderWidth: 1, borderColor: 'rgba(241,200,107,0.28)' },
  pendingText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
  toggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4 },
  toggleItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 5 },
  toggleSelected: { backgroundColor: colors.gold },
  toggleText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  toggleTextSelected: { color: colors.background },
  photoBox: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface },
  photoIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, gap: 3 },
  photoTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  photoSubtitle: { color: colors.textMuted, fontSize: 11 },
  form: { gap: 18 },
  fieldGroup: { gap: 9 },
  fieldLabel: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  pills: { gap: 8, paddingRight: 20 },
  pill: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  pillTextSelected: { color: colors.background },
  priceOptions: { flexDirection: 'row', gap: 7 },
  priceOption: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  priceOptionSelected: { borderColor: colors.gold, backgroundColor: 'rgba(209,174,87,0.10)' },
  priceOptionText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  priceOptionTextSelected: { color: colors.goldSoft },
});
