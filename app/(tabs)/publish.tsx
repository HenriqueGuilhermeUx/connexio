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

export default function PublishScreen() {
  const { member, createListing } = useApp();
  const [type, setType] = useState<ListingType>('SERVICE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Advocacia');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('ON_REQUEST');
  const [benefit, setBenefit] = useState('');

  const submit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Complete a oferta', 'Informe título e descrição antes de publicar.');
      return;
    }
    const created = createListing({
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      city: member?.city ?? 'São Paulo',
      region: member?.region ?? 'Grande São Paulo',
      price: priceType === 'ON_REQUEST' || !price ? undefined : Number(price.replace(',', '.')),
      priceType,
      benefit: benefit.trim() || undefined,
    });
    setTitle(''); setDescription(''); setPrice(''); setBenefit('');
    Alert.alert('Oferta publicada', 'Seu anúncio já aparece no feed de demonstração.', [
      { text: 'Ver anúncio', onPress: () => router.push({ pathname: '/listing/[id]', params: { id: created.id } }) },
    ]);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>NOVA OPORTUNIDADE</Text>
        <Text style={styles.title}>Publique para a rede</Text>
        <Text style={styles.subtitle}>Um anúncio claro gera contatos melhores. A moderação será conectada no backend.</Text>
      </View>

      <View style={styles.toggle}>
        {(['SERVICE', 'PRODUCT'] as ListingType[]).map((item) => (
          <Pressable key={item} onPress={() => setType(item)} style={[styles.toggleItem, type === item && styles.toggleSelected]}>
            <Text style={[styles.toggleText, type === item && styles.toggleTextSelected]}>{item === 'SERVICE' ? 'Serviço' : 'Produto'}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.photoBox} onPress={() => Alert.alert('Próxima integração', 'O seletor de imagens será ativado com expo-image-picker.') }>
        <View style={styles.photoIcon}><Feather name="camera" size={24} color={colors.gold} /></View>
        <View style={styles.photoCopy}>
          <Text style={styles.photoTitle}>Adicionar fotos</Text>
          <Text style={styles.photoSubtitle}>Até 5 imagens · integração na próxima etapa</Text>
        </View>
        <Feather name="plus" size={20} color={colors.textMuted} />
      </Pressable>

      <View style={styles.form}>
        <FormField label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Consultoria contábil para empresas" maxLength={120} />
        <FormField label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Explique o que você oferece, para quem e em quais condições." maxLength={1000} />
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {categories.filter((item) => item !== 'Todos').map((item) => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.pill, category === item && styles.pillSelected]}>
                <Text style={[styles.pillText, category === item && styles.pillTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
        <Button label="Publicar oferta" onPress={submit} />
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
  toggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4 },
  toggleItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  toggleSelected: { backgroundColor: colors.gold },
  toggleText: { color: colors.textMuted, fontWeight: '700' },
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
