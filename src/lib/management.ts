import * as DocumentPicker from 'expo-document-picker';
import { ManagementRequest } from '@/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type PickedEvidence = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

type ManagementRequestInput = Omit<
  ManagementRequest,
  'id' | 'requesterId' | 'requesterName' | 'requesterEmail' | 'status' | 'createdAt' | 'decidedAt'
>;

export async function pickManagementEvidence(): Promise<PickedEvidence | null> {
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

export async function uploadManagementEvidence(asset: PickedEvidence) {
  if (!isSupabaseConfigured || !supabase) {
    return { path: `local/${safeFilename(asset.name)}`, persisted: false };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return { path: `local/${safeFilename(asset.name)}`, persisted: false };

  const response = await fetch(asset.uri);
  const payload = await response.arrayBuffer();
  const path = `${userData.user.id}/${Date.now()}-${safeFilename(asset.name)}`;

  const { error } = await supabase.storage.from('manager-evidence').upload(path, payload, {
    contentType: asset.mimeType ?? 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;

  return { path, persisted: true };
}

export async function persistManagementRequest(input: ManagementRequestInput) {
  if (!isSupabaseConfigured || !supabase || !input.evidencePath) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('management_requests')
    .insert({
      requester_id: userData.user.id,
      lodge_name: input.lodgeName,
      lodge_number: input.lodgeNumber ?? null,
      orient: input.orient,
      region: input.region,
      requested_role: input.requestedRole,
      evidence_name: input.evidenceName,
      evidence_path: input.evidencePath,
      evidence_type: input.evidenceType,
      notes: input.notes ?? null,
    })
    .select('id,status,created_at')
    .single();

  if (error) throw error;
  return data;
}
