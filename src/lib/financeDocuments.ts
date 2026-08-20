import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';

export type FinanceDocument = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

export async function pickFinanceDocument(): Promise<FinanceDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return {
    name: asset.name,
    uri: asset.uri,
    mimeType: asset.mimeType ?? undefined,
    size: asset.size ?? undefined,
  };
}

function safeFilename(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function uploadFinanceDocument(lodgeId: string, document: FinanceDocument) {
  if (!supabase) return { path: document.name, persisted: false };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return { path: document.name, persisted: false };

  const response = await fetch(document.uri);
  const payload = await response.arrayBuffer();
  const path = `${lodgeId}/${Date.now()}-${safeFilename(document.name)}`;
  const { error } = await supabase.storage.from('lodge-finance-documents').upload(path, payload, {
    contentType: document.mimeType ?? 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return { path, persisted: true };
}

export async function getFinanceDocumentUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('lodge-finance-documents').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
