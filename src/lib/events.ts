import { PickedImage } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';
import { ConnexioEvent, EventScope, EventStatus } from '@/types';

export type EventDraftInput = {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  address?: string;
  city: string;
  region: string;
  lodgeName: string;
  contactWhatsapp: string;
  ticketPrice?: number;
  ticketUrl?: string;
  audienceScope: EventScope;
};

export type AdminEventQueueRecord = {
  id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  venue: string;
  address: string | null;
  city: string;
  region: string;
  lodge_name: string;
  contact_whatsapp: string;
  ticket_price: number | null;
  ticket_url: string | null;
  audience_scope: EventScope;
  image_path: string | null;
  status: EventStatus;
  featured: boolean;
  created_at: string;
};

type EventRow = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string | null;
  venue: string;
  address: string | null;
  city: string;
  region: string;
  lodge_name: string;
  contact_whatsapp: string;
  ticket_price: number | null;
  ticket_url: string | null;
  audience_scope: EventScope;
  image_path: string | null;
  status: EventStatus;
  featured: boolean;
  created_at: string;
  profiles: { full_name: string } | null;
};

function extensionFor(image: PickedImage) {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  if (image.mimeType === 'image/png') return 'png';
  if (image.mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function contentTypeFor(image: PickedImage) {
  if (image.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) return image.mimeType;
  const extension = extensionFor(image);
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function signedEventImageUrl(path?: string | null) {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from('event-images').createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

async function mapEvent(row: EventRow): Promise<ConnexioEvent> {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizerName: row.profiles?.full_name || 'Membro Connexio',
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    venue: row.venue,
    address: row.address ?? undefined,
    city: row.city,
    region: row.region,
    lodgeName: row.lodge_name,
    contactWhatsapp: row.contact_whatsapp,
    ticketPrice: row.ticket_price ?? undefined,
    ticketUrl: row.ticket_url ?? undefined,
    audienceScope: row.audience_scope,
    imagePath: row.image_path ?? undefined,
    imageUrl: await signedEventImageUrl(row.image_path),
    status: row.status,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

export async function loadEvents(): Promise<ConnexioEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,organizer_id,title,description,starts_at,ends_at,venue,address,city,region,
      lodge_name,contact_whatsapp,ticket_price,ticket_url,audience_scope,image_path,
      status,featured,created_at,profiles!events_organizer_id_fkey(full_name)
    `)
    .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('featured', { ascending: false })
    .order('starts_at', { ascending: true });
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return [];
    throw error;
  }
  return Promise.all(((data ?? []) as unknown as EventRow[]).map(mapEvent));
}

export async function loadEvent(eventId: string): Promise<ConnexioEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,organizer_id,title,description,starts_at,ends_at,venue,address,city,region,
      lodge_name,contact_whatsapp,ticket_price,ticket_url,audience_scope,image_path,
      status,featured,created_at,profiles!events_organizer_id_fkey(full_name)
    `)
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as unknown as EventRow) : null;
}

export async function createEvent(input: EventDraftInput, image?: PickedImage) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Entre na sua conta para cadastrar um evento.');

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      organizer_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      venue: input.venue.trim(),
      address: input.address?.trim() || null,
      city: input.city.trim(),
      region: input.region.trim().toUpperCase(),
      lodge_name: input.lodgeName.trim(),
      contact_whatsapp: input.contactWhatsapp.replace(/\D/g, ''),
      ticket_price: input.ticketPrice ?? null,
      ticket_url: input.ticketUrl?.trim() || null,
      audience_scope: input.audienceScope,
    })
    .select('id')
    .single();
  if (error) throw error;

  if (image) {
    const response = await fetch(image.uri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = extensionFor(image);
    const path = `${user.id}/${event.id}/cover-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(path, arrayBuffer, { contentType: contentTypeFor(image), upsert: false });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('events')
      .update({ image_path: path })
      .eq('id', event.id);
    if (updateError) throw updateError;
  }

  return event.id as string;
}

export async function loadAdminEventQueue() {
  const { data, error } = await supabase
    .from('admin_event_queue')
    .select('*')
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminEventQueueRecord[];
}

export async function reviewEvent(
  eventId: string,
  decision: 'PUBLISHED' | 'REJECTED' | 'CANCELLED',
  reason?: string,
  featured = false,
) {
  const { error } = await supabase.rpc('admin_review_event', {
    target_event_id: eventId,
    decision,
    review_note: reason?.trim() || null,
    make_featured: featured,
  });
  if (error) throw error;
}

export function eventMatchesMember(event: ConnexioEvent, city?: string, region?: string) {
  if (event.audienceScope === 'NETWORK') return true;
  if (!region) return true;
  if (event.audienceScope === 'CITY') {
    return event.region.toUpperCase() === region.toUpperCase() && event.city.toLowerCase() === (city || '').toLowerCase();
  }
  return event.region.toUpperCase() === region.toUpperCase();
}
