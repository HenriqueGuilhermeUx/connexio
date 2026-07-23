import { Button } from '@/components/Button';
import { CategorySelect } from '@/components/CategorySelect';
import { FormField } from '@/components/FormField';
import { OfferFormNote } from '@/components/OfferFormNote';
import { OfferTypeSelector } from '@/components/OfferTypeSelector';
import { PhotoPicker, SelectedPhoto } from '@/components/PhotoPicker';
import { PriceSelector } from '@/components/PriceSelector';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import { friendlyError } from '@/lib/errors';
import { parseBrazilianPrice, validateListingForm } from '@/lib/validation';
import { ListingType, PriceType } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function PublishScreen() {
  const { member, categories, createListing } = useApp();
  const [type, setType] = useState<ListingType>('SERVICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [city, setCity] = useState(member?.city ?? '');
  const [region, setRegion] = useState(member?.region ?? '');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('ON_REQUEST');
  const [benefit, setBenefit] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState(member?.email ?? '');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categorySlug && categories.length) setCategorySlug(categories[0].slug);
  }, [categories, categorySlug]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setBenefit('');
    setWebsite('');
    setPhotos([]);
  };

  const submit = async () => {
    const currentMember = member;
    const validation = validateListingForm({ title, description, city, region, price, priceType });
    if (validation) {
      Alert.alert('Confira sua oferta', validation);
      return;
    }
    if (!categorySlug) {
      Alert.alert('Escolha um segmento', 'Selecione o segmento que melhor representa sua oferta.');
      return;
    }
    if (!currentMember?.whatsapp) {
      Alert.alert('WhatsApp necessário', 'Inclua um telefone/WhatsApp válido na sua conta.');
      return;
    }

    setSaving(true);
    try {
      const listingId = await createListing({
        type,
        title: title.trim(),
        description: description.trim(),
        categorySlug,
        city: city.trim(),
        region: region.trim(),
        price: priceType === 'ON_REQUEST' ? undefined : parseBrazilianPrice(price),
        priceType,
        benefit: benefit.trim() || undefined,
        website: website.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        whatsapp: currentMember.whatsapp,
      }, photos);

      const pending = currentMember.status !== 'APPROVED';
      reset();
      Alert.alert(
        pending ? 'Oferta salva com sucesso' : 'Oferta enviada para revisão',
        pending
          ? 'Todos os dados foram registrados. A oferta continuará privada até sua validação.'
          : 'A administração fará uma revisão rápida antes da publicação.',
        [{ text: 'Ver oferta', onPress: () => router.push({ pathname: '/listing/[id]', params: { id: listingId } }) }],
      );
    } catch (error) {
      Alert.alert('Não foi possível salvar', friendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenTitle
        eyebrow="O QUE VOCÊ OFERECE?"
        title="Cadastre de forma fácil"
        subtitle="Preencha tudo agora. Você poderá editar depois e nenhuma informação será perdida durante a validação."
      />
      <OfferFormNote pending={member?.status !== 'APPROVED'} />
      <OfferTypeSelector value={type} onChange={setType} />
      <PhotoPicker photos={photos} onChange={setPhotos} />

      <FormField label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Consultoria contábil para empresas" maxLength={120} />
      <FormField label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Explique o que você oferece, para quem e em quais condições." maxLength={1200} />
      <CategorySelect categories={categories} selected={categorySlug} onSelect={setCategorySlug} />
      <FormField label="Cidade de atendimento" value={city} onChangeText={setCity} placeholder="Ex.: Santos" />
      <FormField label="Região" value={region} onChangeText={setRegion} placeholder="Ex.: Baixada Santista" />
      <PriceSelector value={priceType} onChange={setPriceType} />
      {priceType !== 'ON_REQUEST' ? <FormField label="Valor em reais" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0,00" /> : null}
      <FormField label="Benefício exclusivo (opcional)" value={benefit} onChangeText={setBenefit} placeholder="Ex.: 10% de desconto para membros" />
      <FormField label="Site ou rede social (opcional)" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" placeholder="https://" />
      <FormField label="E-mail para contato" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" autoCapitalize="none" />
      <FormField label="WhatsApp para contato" value={member?.whatsapp ?? ''} editable={false} hint="Para alterar, edite o telefone da sua conta." />
      <Button label={member?.status === 'APPROVED' ? 'Enviar para revisão' : 'Salvar minha oferta'} onPress={() => void submit()} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, gap: 20 },
});
