import { supabase } from '@/lib/supabase';

export type PickedLodgeFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export async function loadLodgeFeed(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lodge_feed_items')
    .select('*')
    .eq('lodge_id', lodgeId)
    .eq('active', true)
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function publishLodgeItem(lodgeId: string, input: { type: string; title: string; summary?: string; sourceId?: string; audience?: string }) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('publish_lodge_item', {
    target_lodge: lodgeId,
    target_type: input.type,
    target_title: input.title,
    target_summary: input.summary ?? null,
    target_source: input.sourceId ?? null,
    target_audience: input.audience ?? 'ALL',
  });
  if (error) throw error;
  return data as string | null;
}

export async function loadLodgeDocuments(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lodge_documents')
    .select('*')
    .eq('lodge_id', lodgeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadLodgeDocument(lodgeId: string, input: { title: string; category: string; description?: string; visibility: 'MEMBERS' | 'MANAGERS'; file: PickedLodgeFile }) {
  if (!supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Faça login novamente.');

  const safeName = sanitizeFileName(input.file.name);
  const path = `${lodgeId}/${uniqueFileId()}-${safeName}`;
  const response = await fetch(input.file.uri);
  const buffer = await response.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('lodge-documents').upload(path, buffer, {
    contentType: input.file.mimeType || undefined,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('lodge_documents').insert({
    lodge_id: lodgeId,
    title: input.title,
    category: input.category,
    description: input.description || null,
    file_name: input.file.name,
    storage_path: path,
    mime_type: input.file.mimeType || null,
    visibility: input.visibility,
    created_by: auth.user.id,
  }).select('*').single();
  if (error) {
    await supabase.storage.from('lodge-documents').remove([path]);
    throw error;
  }

  if (input.visibility === 'MEMBERS') {
    await publishLodgeItem(lodgeId, { type: 'DOCUMENT', title: input.title, summary: input.description, sourceId: data.id });
  }
  return data;
}

export async function getLodgeDocumentUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('lodge-documents').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadLearningMaterial(lodgeId: string, learningItemId: string, input: { title: string; file: PickedLodgeFile }) {
  if (!supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Faça login novamente.');

  const safeName = sanitizeFileName(input.file.name);
  const path = `${lodgeId}/${learningItemId}/${uniqueFileId()}-${safeName}`;
  const response = await fetch(input.file.uri);
  const buffer = await response.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('lodge-learning').upload(path, buffer, {
    contentType: input.file.mimeType || undefined,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from('lodge_learning_materials').insert({
    lodge_id: lodgeId,
    learning_item_id: learningItemId,
    title: input.title,
    file_name: input.file.name,
    storage_path: path,
    mime_type: input.file.mimeType || null,
    created_by: auth.user.id,
  }).select('*').single();
  if (error) {
    await supabase.storage.from('lodge-learning').remove([path]);
    throw error;
  }
  return data;
}

export async function loadLearningMaterials(learningItemIds: string[]) {
  if (!supabase || !learningItemIds.length) return [];
  const { data, error } = await supabase
    .from('lodge_learning_materials')
    .select('*')
    .in('learning_item_id', learningItemIds)
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getLearningMaterialUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('lodge-learning').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function publishLearningItem(itemId: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('publish_learning_item', { target_item: itemId });
  if (error) throw error;
}

export async function setOwnLearningProgress(itemId: string, status: 'PENDING' | 'IN_PROGRESS' | 'DONE') {
  if (!supabase) return;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Faça login novamente.');
  const { error } = await supabase.from('lodge_learning_progress').upsert({
    learning_item_id: itemId,
    member_id: auth.user.id,
    status,
    completed_at: status === 'DONE' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'learning_item_id,member_id' });
  if (error) throw error;
}

export async function loadOwnLearningProgress(itemIds: string[]) {
  if (!supabase || !itemIds.length) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('lodge_learning_progress').select('*').eq('member_id', auth.user.id).in('learning_item_id', itemIds);
  if (error) throw error;
  return data ?? [];
}

function sanitizeFileName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
}

function uniqueFileId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
