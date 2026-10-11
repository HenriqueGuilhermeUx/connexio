import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import {
  getLearningMaterialUrl,
  loadLearningMaterials,
  publishLearningItem,
  uploadLearningMaterial,
} from '@/lib/lodgeHubRepository';
import { createLearningItem, loadLearningItems, seedLearningPath } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const audiences = ['APPRENTICE','COMPANION','MASTER','LEADERSHIP','ALL'] as const;
type Audience = typeof audiences[number];

type Feedback = { type:'success'|'error'; text:string } | null;

export default function ManagerEducationScreen() {
  const { lodge } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('APPRENTICE');
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const reload = async () => {
    if (!lodge) return;
    try {
      const loaded = await loadLearningItems(lodge.id);
      setItems(loaded);
      setMaterials(await loadLearningMaterials(loaded.map((item:any)=>item.id)));
    } catch (error) {
      setFeedback({ type:'error', text:errorMessage(error) });
    }
  };
  useEffect(() => { void reload(); }, [lodge?.id]);

  const groups = useMemo(() => audiences
    .map((value) => ({ value, items: items.filter((item) => item.audience === value) }))
    .filter((group) => group.items.length), [items]);

  const seed = async () => {
    if (!lodge) return;
    setBusy('seed'); setFeedback(null);
    try {
      const count = await seedLearningPath(lodge.id);
      await reload();
      setFeedback({ type:'success', text:`Trilha preparada. ${count} novo(s) item(ns) incluído(s).` });
    } catch (error) { setFeedback({ type:'error', text:errorMessage(error) }); }
    finally { setBusy(null); }
  };

  const add = async () => {
    if (!lodge || !title.trim()) { setFeedback({type:'error',text:'Informe o título da formação.'}); return; }
    setBusy('add'); setFeedback(null);
    try {
      await createLearningItem(lodge.id, { title: title.trim(), audience, description: description.trim() || undefined });
      setTitle(''); setDescription(''); await reload();
      setFeedback({type:'success',text:'Formação adicionada à trilha.'});
    } catch (error) { setFeedback({type:'error',text:errorMessage(error)}); }
    finally { setBusy(null); }
  };

  const attach = async (item:any) => {
    if (!lodge) return;
    setBusy(`file-${item.id}`); setFeedback(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:['application/pdf','image/*'],
        copyToCacheDirectory:true,
        multiple:false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      await uploadLearningMaterial(lodge.id, item.id, {
        title: asset.name,
        file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
      });
      await reload();
      setFeedback({type:'success',text:`Material anexado a “${item.title}”.`});
    } catch (error) { setFeedback({type:'error',text:errorMessage(error)}); }
    finally { setBusy(null); }
  };

  const publish = async (item:any) => {
    setBusy(`publish-${item.id}`); setFeedback(null);
    try {
      await publishLearningItem(item.id);
      await reload();
      setFeedback({type:'success',text:`“${item.title}” foi publicado na Central da Loja para ${audienceLabel(item.audience).toLowerCase()}.`});
    } catch (error) { setFeedback({type:'error',text:errorMessage(error)}); }
    finally { setBusy(null); }
  };

  const openMaterial = async (material:any) => {
    try {
      const url = await getLearningMaterialUrl(material.storage_path);
      if (url) await Linking.openURL(url);
    } catch (error) { setFeedback({type:'error',text:errorMessage(error)}); }
  };

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}>
      <Text style={styles.eyebrow}>GESTOR PRO · CONHECIMENTO</Text>
      <Text style={styles.title}>Educação & formação</Text>
      <Text style={styles.subtitle}>Crie trilhas, anexe PDFs e fotos, publique materiais para os irmãos e acompanhe a evolução por etapa.</Text>
    </View>

    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={styles.callout}>
      <Feather name="book-open" size={20} color={colors.gold}/>
      <View style={styles.flex}><Text style={styles.calloutTitle}>Trilha inicial pronta para usar</Text><Text style={styles.calloutText}>Simbolismo, história, direitos/deveres, filosofia, gestão, planejamento, finanças e liderança.</Text></View>
      <Button label="Criar trilha" loading={busy==='seed'} onPress={() => void seed()} style={styles.smallButton}/>
    </View>

    <View style={styles.form}>
      <Text style={styles.formTitle}>Adicionar formação</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <Text style={styles.label}>Público</Text>
      <View style={styles.chips}>{audiences.map((value)=><Pressable key={value} onPress={()=>setAudience(value)} style={[styles.chip,audience===value&&styles.chipActive]}><Text style={[styles.chipText,audience===value&&styles.chipTextActive]}>{audienceLabel(value)}</Text></Pressable>)}</View>
      <TextInput value={description} onChangeText={setDescription} multiline placeholder="Objetivo, orientação ou conteúdo" placeholderTextColor={colors.textMuted} style={[styles.input,styles.notes]}/>
      <Button label="Adicionar à trilha" loading={busy==='add'} onPress={()=>void add()}/>
    </View>

    {groups.map((group)=><View key={group.value} style={styles.section}>
      <Text style={styles.sectionTitle}>{audienceLabel(group.value)}</Text>
      {group.items.map((item:any)=>{
        const itemMaterials=materials.filter((m:any)=>m.learning_item_id===item.id);
        return <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemHeader}><View style={styles.icon}><Feather name={item.category==='LEADERSHIP'?'award':'book'} size={18} color={colors.gold}/></View><View style={styles.flex}><View style={styles.titleRow}><Text style={styles.itemTitle}>{item.title}</Text>{item.published?<Text style={styles.published}>PUBLICADO</Text>:null}</View>{item.description?<Text style={styles.meta}>{item.description}</Text>:null}</View></View>
          {itemMaterials.length?<View style={styles.materialList}>{itemMaterials.map((material:any)=><Pressable key={material.id} onPress={()=>void openMaterial(material)} style={styles.material}><Feather name={material.mime_type?.startsWith('image/')?'image':'file-text'} size={15} color={colors.gold}/><Text style={styles.materialText}>{material.title}</Text><Feather name="external-link" size={14} color={colors.textMuted}/></Pressable>)}</View>:<Text style={styles.noMaterial}>Nenhum material anexado.</Text>}
          <View style={styles.actions}><Button label="Anexar PDF/foto" variant="secondary" loading={busy===`file-${item.id}`} disabled={busy!==null} onPress={()=>void attach(item)} style={styles.action}/><Button label={item.published?'Publicado':'Publicar aos membros'} loading={busy===`publish-${item.id}`} disabled={busy!==null||item.published} onPress={()=>void publish(item)} style={styles.action}/></View>
        </View>;
      })}
    </View>)}
    {!items.length ? <Text style={styles.empty}>Crie a trilha inicial ou adicione a primeira formação da Loja.</Text> : null}
  </Screen>;
}

function audienceLabel(value:string){const map:Record<string,string>={APPRENTICE:'Aprendizes',COMPANION:'Companheiros',MASTER:'Mestres',LEADERSHIP:'Formação de lideranças',ALL:'Todos os irmãos'};return map[value]??value;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message; if(error&&typeof error==='object'&&'message'in error)return String((error as any).message); return 'Tente novamente.';}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},callout:{flexDirection:'row',alignItems:'center',gap:11,padding:14,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.gold},flex:{flex:1,gap:3},calloutTitle:{color:colors.text,fontSize:12,fontWeight:'900'},calloutText:{color:colors.textMuted,fontSize:9,lineHeight:14},smallButton:{minHeight:40,paddingHorizontal:12},form:{gap:11,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},formTitle:{color:colors.text,fontSize:15,fontWeight:'900'},label:{color:colors.textMuted,fontSize:9,fontWeight:'800'},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},notes:{minHeight:80,paddingTop:12,textAlignVertical:'top'},chips:{flexDirection:'row',flexWrap:'wrap',gap:6},chip:{paddingHorizontal:9,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,0.10)'},chipText:{color:colors.textMuted,fontSize:8,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},section:{gap:8},sectionTitle:{color:colors.cream,fontSize:15,fontWeight:'900'},itemCard:{gap:11,padding:13,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},itemHeader:{flexDirection:'row',alignItems:'center',gap:10},icon:{width:38,height:38,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},titleRow:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'},itemTitle:{color:colors.text,fontSize:12,fontWeight:'800'},published:{color:colors.success,fontSize:7,fontWeight:'900',borderWidth:1,borderColor:colors.success,borderRadius:999,paddingHorizontal:6,paddingVertical:2},meta:{color:colors.textMuted,fontSize:9,lineHeight:14},materialList:{gap:6},material:{flexDirection:'row',alignItems:'center',gap:8,padding:9,borderRadius:11,backgroundColor:colors.surfaceRaised},materialText:{flex:1,color:colors.text,fontSize:9,fontWeight:'700'},noMaterial:{color:colors.textMuted,fontSize:9,fontStyle:'italic'},actions:{flexDirection:'row',gap:8,flexWrap:'wrap'},action:{flex:1,minWidth:160,minHeight:42},empty:{color:colors.textMuted,fontSize:11,textAlign:'center',paddingVertical:20}});
