import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import {
  getLearningMaterialUrl,
  getLodgeDocumentUrl,
  loadLearningMaterials,
  loadLodgeDocuments,
  loadLodgeFeed,
  loadOwnLearningProgress,
  setOwnLearningProgress,
} from '@/lib/lodgeHubRepository';
import { loadLearningItems } from '@/lib/solPeopleRepository';
import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type Tab='FEED'|'EDUCATION'|'DOCUMENTS';

type Feedback={type:'success'|'error';text:string}|null;

export default function LodgeHubScreen(){
  const{lodge,membership}=useApp();
  const[tab,setTab]=useState<Tab>('FEED');
  const[feed,setFeed]=useState<any[]>([]);
  const[learning,setLearning]=useState<any[]>([]);
  const[materials,setMaterials]=useState<any[]>([]);
  const[progress,setProgress]=useState<any[]>([]);
  const[documents,setDocuments]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[feedback,setFeedback]=useState<Feedback>(null);

  const reload=async()=>{
    if(!lodge)return;
    setLoading(true);
    try{
      const[feedRows,learningRows,docRows]=await Promise.all([loadLodgeFeed(lodge.id),loadLearningItems(lodge.id),loadLodgeDocuments(lodge.id)]);
      const published=learningRows.filter((item:any)=>item.published);
      setFeed(feedRows);setLearning(published);setDocuments(docRows.filter((item:any)=>item.visibility==='MEMBERS'));
      const[materialRows,progressRows]=await Promise.all([loadLearningMaterials(published.map((item:any)=>item.id)),loadOwnLearningProgress(published.map((item:any)=>item.id))]);
      setMaterials(materialRows);setProgress(progressRows);
    }catch(error){setFeedback({type:'error',text:errorMessage(error)});}finally{setLoading(false);}
  };
  useEffect(()=>{void reload();},[lodge?.id]);

  const progressByItem=useMemo(()=>new Map(progress.map((row:any)=>[row.learning_item_id,row.status])),[progress]);

  const updateProgress=async(itemId:string,status:'IN_PROGRESS'|'DONE')=>{
    try{await setOwnLearningProgress(itemId,status);await reload();setFeedback({type:'success',text:status==='DONE'?'Formação marcada como concluída.':'Formação iniciada.'});}catch(error){setFeedback({type:'error',text:errorMessage(error)});}
  };

  const openDocument=async(path:string,kind:'DOCUMENT'|'LEARNING')=>{
    try{const url=kind==='DOCUMENT'?await getLodgeDocumentUrl(path):await getLearningMaterialUrl(path);if(url)await Linking.openURL(url);}catch(error){setFeedback({type:'error',text:errorMessage(error)});}
  };

  if(!lodge||!membership)return <Screen contentStyle={styles.content}><View style={styles.emptyCard}><Feather name="home" size={28} color={colors.gold}/><Text style={styles.emptyTitle}>Você ainda não está vinculado a uma Loja</Text><Text style={styles.emptyText}>Quando seu vínculo for aprovado, a Central da Loja aparecerá aqui.</Text></View></Screen>;

  return <Screen contentStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>ÁREA PRIVADA DA LOJA</Text><Text style={styles.title}>{lodge.name}</Text><Text style={styles.subtitle}>Sessões, comunicados, documentos e formação publicados pela gestão para os irmãos.</Text></View>
    {feedback?<View style={[styles.feedback,feedback.type==='error'?styles.feedbackError:styles.feedbackSuccess]}><Feather name={feedback.type==='error'?'alert-circle':'check-circle'} size={18} color={feedback.type==='error'?colors.danger:colors.success}/><Text style={styles.feedbackText}>{feedback.text}</Text></View>:null}
    <View style={styles.tabs}><TabButton label="Mural" icon="bell" active={tab==='FEED'} onPress={()=>setTab('FEED')}/><TabButton label="Educação" icon="book-open" active={tab==='EDUCATION'} onPress={()=>setTab('EDUCATION')}/><TabButton label="Documentos" icon="folder" active={tab==='DOCUMENTS'} onPress={()=>setTab('DOCUMENTS')}/></View>

    {loading?<Text style={styles.loading}>Carregando informações da Loja…</Text>:null}

    {!loading&&tab==='FEED'?<View style={styles.section}>{feed.map((item:any)=><View key={item.id} style={styles.feedCard}><View style={styles.feedIcon}><Feather name={feedIcon(item.item_type)} size={18} color={colors.gold}/></View><View style={styles.flex}><View style={styles.titleRow}><Text style={styles.feedType}>{feedLabel(item.item_type)}</Text><Text style={styles.date}>{new Date(item.published_at).toLocaleDateString('pt-BR')}</Text></View><Text style={styles.cardTitle}>{item.title}</Text>{item.summary?<Text style={styles.cardText}>{item.summary}</Text>:null}</View></View>)}{!feed.length?<Empty text="A gestão ainda não publicou informações no Mural da Loja."/>:null}</View>:null}

    {!loading&&tab==='EDUCATION'?<View style={styles.section}>{learning.map((item:any)=>{const status=progressByItem.get(item.id)??'PENDING';const itemMaterials=materials.filter((m:any)=>m.learning_item_id===item.id);return <View key={item.id} style={styles.learningCard}><View style={styles.titleRow}><Text style={styles.audience}>{audienceLabel(item.audience)}</Text><Text style={[styles.progress,status==='DONE'&&styles.done]}>{progressLabel(status)}</Text></View><Text style={styles.cardTitle}>{item.title}</Text>{item.description?<Text style={styles.cardText}>{item.description}</Text>:null}{itemMaterials.map((m:any)=><Pressable key={m.id} onPress={()=>void openDocument(m.storage_path,'LEARNING')} style={styles.file}><Feather name={m.mime_type?.startsWith('image/')?'image':'file-text'} size={15} color={colors.gold}/><Text style={styles.fileText}>{m.title}</Text><Feather name="external-link" size={14} color={colors.textMuted}/></Pressable>)}<View style={styles.actions}>{status==='PENDING'?<Button label="Iniciar" variant="secondary" onPress={()=>void updateProgress(item.id,'IN_PROGRESS')} style={styles.action}/>:null}{status!=='DONE'?<Button label="Concluir" onPress={()=>void updateProgress(item.id,'DONE')} style={styles.action}/>:null}</View></View>;})}{!learning.length?<Empty text="Ainda não há trilhas publicadas para os membros."/>:null}</View>:null}

    {!loading&&tab==='DOCUMENTS'?<View style={styles.section}>{documents.map((item:any)=><Pressable key={item.id} onPress={()=>void openDocument(item.storage_path,'DOCUMENT')} style={styles.documentCard}><View style={styles.feedIcon}><Feather name={item.mime_type?.startsWith('image/')?'image':'file-text'} size={18} color={colors.gold}/></View><View style={styles.flex}><Text style={styles.feedType}>{categoryLabel(item.category)}</Text><Text style={styles.cardTitle}>{item.title}</Text>{item.description?<Text style={styles.cardText}>{item.description}</Text>:null}</View><Feather name="external-link" size={16} color={colors.textMuted}/></Pressable>)}{!documents.length?<Empty text="Ainda não há documentos compartilhados com os membros."/>:null}</View>:null}
  </Screen>;
}

function TabButton({label,icon,active,onPress}:{label:string;icon:keyof typeof Feather.glyphMap;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.tab,active&&styles.tabActive]}><Feather name={icon} size={16} color={active?colors.gold:colors.textMuted}/><Text style={[styles.tabText,active&&styles.tabTextActive]}>{label}</Text></Pressable>;}
function Empty({text}:{text:string}){return <View style={styles.emptyCard}><Feather name="inbox" size={24} color={colors.gold}/><Text style={styles.emptyText}>{text}</Text></View>;}
function feedIcon(type:string):keyof typeof Feather.glyphMap{const map:any={ANNOUNCEMENT:'bell',SESSION:'calendar',MINUTES:'file-text',PLAN:'target',LEARNING:'book-open',DOCUMENT:'folder'};return map[type]??'info';}
function feedLabel(type:string){const map:Record<string,string>={ANNOUNCEMENT:'COMUNICADO',SESSION:'SESSÃO',MINUTES:'ATA',PLAN:'PLANEJAMENTO',LEARNING:'EDUCAÇÃO',DOCUMENT:'DOCUMENTO'};return map[type]??type;}
function audienceLabel(value:string){const map:Record<string,string>={APPRENTICE:'Aprendizes',COMPANION:'Companheiros',MASTER:'Mestres',LEADERSHIP:'Lideranças',ALL:'Todos os irmãos'};return map[value]??value;}
function progressLabel(value:string){if(value==='DONE')return'CONCLUÍDO';if(value==='IN_PROGRESS')return'EM ANDAMENTO';return'NÃO INICIADO';}
function categoryLabel(value:string){const map:Record<string,string>={POSSESSION:'POSSE',MINUTES:'ATAS',CONSTITUTION:'CONSTITUIÇÃO',REGULATION:'REGIMENTO',CIRCULAR:'CIRCULAR',FINANCE:'FINANCEIRO',EDUCATION:'EDUCAÇÃO',OTHER:'DOCUMENTO'};return map[value]??value;}
function errorMessage(error:unknown){if(error instanceof Error)return error.message;if(error&&typeof error==='object'&&'message'in error)return String((error as any).message);return'Tente novamente.';}

const styles=StyleSheet.create({content:{paddingTop:22,gap:18},header:{gap:5},eyebrow:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.cream,fontSize:27,fontWeight:'900'},subtitle:{color:colors.textMuted,fontSize:13,lineHeight:19},feedback:{flexDirection:'row',gap:9,padding:13,borderRadius:14,borderWidth:1},feedbackError:{borderColor:colors.danger,backgroundColor:'rgba(245,141,141,.08)'},feedbackSuccess:{borderColor:colors.success,backgroundColor:'rgba(109,207,151,.08)'},feedbackText:{flex:1,color:colors.text,fontSize:11,lineHeight:17},tabs:{flexDirection:'row',gap:7,flexWrap:'wrap'},tab:{flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:13,paddingVertical:10,borderRadius:13,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},tabActive:{borderColor:colors.gold,backgroundColor:'rgba(209,174,87,.09)'},tabText:{color:colors.textMuted,fontSize:10,fontWeight:'800'},tabTextActive:{color:colors.goldSoft},loading:{color:colors.textMuted,textAlign:'center',paddingVertical:30},section:{gap:10},feedCard:{flexDirection:'row',gap:11,padding:14,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},feedIcon:{width:40,height:40,borderRadius:12,backgroundColor:colors.surfaceRaised,alignItems:'center',justifyContent:'center'},flex:{flex:1,gap:4},titleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'},feedType:{color:colors.gold,fontSize:8,fontWeight:'900',letterSpacing:.7},date:{color:colors.textMuted,fontSize:8},cardTitle:{color:colors.text,fontSize:13,fontWeight:'900'},cardText:{color:colors.textMuted,fontSize:10,lineHeight:16},learningCard:{gap:10,padding:15,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},audience:{color:colors.gold,fontSize:8,fontWeight:'900'},progress:{color:colors.textMuted,fontSize:8,fontWeight:'900'},done:{color:colors.success},file:{flexDirection:'row',alignItems:'center',gap:8,padding:10,borderRadius:11,backgroundColor:colors.surfaceRaised},fileText:{flex:1,color:colors.text,fontSize:9,fontWeight:'700'},actions:{flexDirection:'row',gap:8},action:{flex:1,minHeight:42},documentCard:{flexDirection:'row',alignItems:'center',gap:11,padding:14,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyCard:{alignItems:'center',gap:8,padding:24,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyTitle:{color:colors.text,fontSize:14,fontWeight:'900'},emptyText:{color:colors.textMuted,fontSize:10,lineHeight:16,textAlign:'center'}});
