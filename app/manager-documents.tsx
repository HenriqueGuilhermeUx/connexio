import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { getLodgeDocumentUrl, loadLodgeDocuments, uploadLodgeDocument } from '@/lib/lodgeHubRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const categories = ['POSSESSION','MINUTES','CONSTITUTION','REGULATION','CIRCULAR','FINANCE','EDUCATION','OTHER'] as const;

type Feedback = { type:'success'|'error'; text:string } | null;

export default function ManagerDocumentsScreen(){
  const { lodge } = useApp();
  const [items,setItems]=useState<any[]>([]);
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [category,setCategory]=useState<(typeof categories)[number]>('OTHER');
  const [visibility,setVisibility]=useState<'MEMBERS'|'MANAGERS'>('MEMBERS');
  const [picked,setPicked]=useState<{uri:string;name:string;mimeType?:string|null}|null>(null);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState<Feedback>(null);

  const reload=async()=>{if(!lodge)return;try{setItems(await loadLodgeDocuments(lodge.id));}catch(error){setFeedback({type:'error',text:errorMessage(error)});}};
  useEffect(()=>{void reload();},[lodge?.id]);

  const choose=async()=>{
    const result=await DocumentPicker.getDocumentAsync({type:['application/pdf','image/*'],copyToCacheDirectory:true,multiple:false});
    if(result.canceled)return;
    const asset=result.assets[0];
    setPicked({uri:asset.uri,name:asset.name,mimeType:asset.mimeType});
    if(!title.trim())setTitle(asset.name.replace(/\.[^.]+$/,''));
  };

  const save=async()=>{
    if(!lodge||!picked||!title.trim()){setFeedback({type:'error',text:'Informe o título e selecione um PDF ou imagem.'});return;}
    setBusy(true);setFeedback(null);
    try{
      await uploadLodgeDocument(lodge.id,{title:title.trim(),category,description:description.trim()||undefined,visibility,file:picked});
      setTitle('');setDescription('');setPicked(null);setCategory('OTHER');setVisibility('MEMBERS');
      await reload();
      setFeedback({type:'success',text:visibility==='MEMBERS'?'Documento salvo e compartilhado na Central da Loja.':'Documento salvo somente para gestores.'});
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setBusy(false);}
  };

  const open=async(item:any)=>{try{const url=await getLodgeDocumentUrl(item.storage_path);if(url)await Linking.openURL(url);}catch(error){setFeedback({type:'error',text:errorMessage(error)});}};

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>GESTOR · BIBLIOTECA</Text><Text style={styles.title}>Documentos da Loja</Text><Text style={styles.subtitle}>Centralize posse, atas, Constituição, Regimento, circulares, documentos financeiros e materiais internos. Cada arquivo pode ser só da gestão ou compartilhado com todos os membros.</Text></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}

    <View style={styles.form}>
      <Text style={styles.formTitle}>Adicionar documento</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Título do documento" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.chips}>{categories.map(value=><Pressable key={value} onPress={()=>setCategory(value)} style={[styles.chip,category===value&&styles.chipActive]}><Text style={[styles.chipText,category===value&&styles.chipTextActive]}>{categoryLabel(value)}</Text></Pressable>)}</View>
      <TextInput value={description} onChangeText={setDescription} placeholder="Descrição opcional" placeholderTextColor={colors.textMuted} style={styles.input}/>
      <Text style={styles.label}>Quem pode ver?</Text>
      <View style={styles.chips}><Pressable onPress={()=>setVisibility('MEMBERS')} style={[styles.chip,visibility==='MEMBERS'&&styles.chipActive]}><Text style={[styles.chipText,visibility==='MEMBERS'&&styles.chipTextActive]}>Todos os membros</Text></Pressable><Pressable onPress={()=>setVisibility('MANAGERS')} style={[styles.chip,visibility==='MANAGERS'&&styles.chipActive]}><Text style={[styles.chipText,visibility==='MANAGERS'&&styles.chipTextActive]}>Somente gestores</Text></Pressable></View>
      <Pressable onPress={()=>void choose()} style={styles.filePicker}><Feather name="upload" size={18} color={colors.gold}/><View style={styles.flex}><Text style={styles.fileTitle}>{picked?.name??'Selecionar PDF ou foto'}</Text><Text style={styles.fileText}>Atas assinadas, termo de posse, Constituição, Regimento, fotos digitalizadas etc.</Text></View></Pressable>
      <Button label="Salvar documento" loading={busy} onPress={()=>void save()}/>
    </View>

    <View style={styles.section}><Text style={styles.sectionTitle}>Biblioteca</Text>{items.map(item=><Pressable key={item.id} onPress={()=>void open(item)} style={styles.card}><View style={styles.icon}><Feather name={item.mime_type?.startsWith('image/')?'image':'file-text'} size={18} color={colors.gold}/></View><View style={styles.flex}><View style={styles.titleRow}><Text style={styles.cardTitle}>{item.title}</Text><Text style={item.visibility==='MEMBERS'?styles.shared:styles.privateBadge}>{item.visibility==='MEMBERS'?'MEMBROS':'GESTÃO'}</Text></View><Text style={styles.meta}>{categoryLabel(item.category)} · {item.file_name}</Text>{item.description?<Text style={styles.meta}>{item.description}</Text>:null}</View><Feather name="external-link" size={16} color={colors.textMuted}/></Pressable>)}{!items.length?<Text style={styles.empty}>Nenhum documento cadastrado ainda.</Text>:null}</View>
  </Screen>;
}

function categoryLabel(value:string){const map:Record<string,string>={POSSESSION:'Posse',MINUTES:'Atas',CONSTITUTION:'Constituição',REGULATION:'Regimento',CIRCULAR:'Circulares',FINANCE:'Financeiro',EDUCATION:'Educação',OTHER:'Outros'};return map[value]??value;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}
const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:6},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},form:{gap:11,padding:16,borderRadius:19,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},formTitle:{color:colors.text,fontSize:15,fontWeight:'900'},label:{color:colors.textMuted,fontSize:9,fontWeight:'800'},input:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,color:colors.text,paddingHorizontal:13},chips:{flexDirection:'row',flexWrap:'wrap',gap:6},chip:{paddingHorizontal:9,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:colors.border},chipActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.10)'},chipText:{color:colors.textMuted,fontSize:8,fontWeight:'700'},chipTextActive:{color:colors.goldSoft},filePicker:{flexDirection:'row',alignItems:'center',gap:11,padding:13,borderRadius:14,borderWidth:1,borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.05)'},flex:{flex:1,gap:3},fileTitle:{color:colors.text,fontSize:11,fontWeight:'900'},fileText:{color:colors.textMuted,fontSize:9,lineHeight:14},section:{gap:9},sectionTitle:{color:colors.cream,fontSize:16,fontWeight:'900'},card:{flexDirection:'row',alignItems:'center',gap:10,padding:13,borderRadius:15,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},icon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},titleRow:{flexDirection:'row',gap:8,alignItems:'center',flexWrap:'wrap'},cardTitle:{color:colors.text,fontSize:12,fontWeight:'800'},meta:{color:colors.textMuted,fontSize:9,lineHeight:14},shared:{color:colors.success,fontSize:7,fontWeight:'900',borderWidth:1,borderColor:colors.success,borderRadius:999,paddingHorizontal:6,paddingVertical:2},privateBadge:{color:colors.goldSoft,fontSize:7,fontWeight:'900',borderWidth:1,borderColor:colors.gold,borderRadius:999,paddingHorizontal:6,paddingVertical:2},empty:{color:colors.textMuted,fontSize:11,textAlign:'center',paddingVertical:20}});
