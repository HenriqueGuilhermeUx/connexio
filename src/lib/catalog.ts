import { supabase } from '@/lib/supabase';
import {
  AdminListingQueueRecord,
  AdminMemberQueueRecord,
  CategoryRecord,
  ListingQueryRecord,
} from '@/types/database';
import { BlockedMember, Listing, ListingType, PriceType } from '@/types';

export type ListingDraftInput = {
  type: ListingType;
  title: string;
  description: string;
  categorySlug: string;
  city: string;
  region: string;
  price?: number;
  priceType: PriceType;
  benefit?: string;
  website?: string;
  contactEmail?: string;
  whatsapp: string;
};

export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
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

async function signedImageUrl(path?: string | null) {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from('listing-images').createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

export async function loadCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('slug,name,position,active')
    .eq('active', true)
    .order('position');
  if (error) throw error;
  return (data ?? []) as CategoryRecord[];
}

export async function loadCatalog(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,owner_id,type,title,description,category_slug,city,region,price,price_type,
      benefit,website,status,is_preview,created_at,updated_at,published_at,
      profiles!listings_owner_id_fkey(full_name,status),
      categories!listings_category_slug_fkey(name),
      listing_images(id,listing_id,storage_path,position,created_at),
      listing_contacts(listing_id,contact_name,whatsapp,email)
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as ListingQueryRecord[];
  return Promise.all(rows.map(async (row) => {
    const images = [...(row.listing_images ?? [])].sort((a, b) => a.position - b.position);
    const imageUrl = await signedImageUrl(images[0]?.storage_path);
    const contact = row.listing_contacts?.[0];
    return {
      id: row.id,
      ownerId: row.owner_id,
      ownerName: row.profiles?.full_name || 'Membro Connexio',
      ownerLodge: 'Membro Connexio',
      ownerVerified: row.profiles?.status === 'APPROVED',
      type: row.type,
      title: row.title,
      description: row.description,
      category: row.categories?.name || row.category_slug,
      categorySlug: row.category_slug,
      city: row.city || '',
      region: row.region || '',
      price: row.price ?? undefined,
      priceType: row.price_type,
      benefit: row.benefit ?? undefined,
      website: row.website ?? undefined,
      contactEmail: contact?.email ?? undefined,
      phone: contact?.whatsapp || '',
      imageUrl,
      status: row.status,
      isPreview: row.is_preview,
      createdAt: row.created_at,
    } satisfies Listing;
  }));
}

export async function createListing(input: ListingDraftInput, images: PickedImage[] = []) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Entre na sua conta para cadastrar uma oferta.');

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      owner_id: user.id,
      type: input.type,
      title: input.title,
      description: input.description,
      category_slug: input.categorySlug,
      city: input.city,
      region: input.region,
      price: input.price ?? null,
      price_type: input.priceType,
      benefit: input.benefit ?? null,
      website: input.website ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: contactError } = await supabase.from('listing_contacts').insert({
    listing_id: listing.id,
    contact_name: null,
    whatsapp: input.whatsapp,
    email: input.contactEmail ?? null,
  });
  if (contactError) throw contactError;

  for (let position = 0; position < images.length; position += 1) {
    const image = images[position];
    const response = await fetch(image.uri);
    const arrayBuffer = await response.arrayBuffer();
    const extension = extensionFor(image);
    const path = `${user.id}/${listing.id}/${position}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, arrayBuffer, { contentType: contentTypeFor(image), upsert: false });
    if (uploadError) throw uploadError;

    const { error: imageError } = await supabase.from('listing_images').insert({
      listing_id: listing.id,
      storage_path: path,
      position,
    });
    if (imageError) throw imageError;
  }

  return listing.id as string;
}

export async function loadFavoriteIds() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', authData.user.id);
  if (error) throw error;
  return (data ?? []).map((item) => item.listing_id as string);
}

export async function setFavorite(listingId: string, favorite: boolean) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Entre para salvar favoritos.');
  if (favorite) {
    const { error } = await supabase.from('favorites').upsert({
      user_id: authData.user.id,
      listing_id: listingId,
    });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', authData.user.id)
    .eq('listing_id', listingId);
  if (error) throw error;
}

export async function loadBlockedMembers(): Promise<BlockedMember[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const { data: blocks, error } = await supabase
    .from('user_blocks')
    .select('blocked_id,created_at')
    .eq('blocker_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return [];
    throw error;
  }

  const ids = (blocks ?? []).map((block) => block.blocked_id as string);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name')
    .in('id', ids);
  if (profileError) throw profileError;

  const names = new Map((profiles ?? []).map((profile) => [profile.id as string, profile.full_name as string]));
  return (blocks ?? []).map((block) => ({
    id: block.blocked_id as string,
    name: names.get(block.blocked_id as string) || 'Membro Connexio',
    createdAt: block.created_at as string,
  }));
}

export async function blockMember(userId: string) {
  const { error } = await supabase.rpc('block_member', { target_user_id: userId });
  if (error) throw error;
}

export async function unblockMember(userId: string) {
  const { error } = await supabase.rpc('unblock_member', { target_user_id: userId });
  if (error) throw error;
}

export async function loadAdminMemberQueue() {
  const { data, error } = await supabase
    .from('admin_member_queue')
    .select('*')
    .eq('status', 'PENDING')
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminMemberQueueRecord[];
}

export async function loadAdminListingQueue() {
  const { data, error } = await supabase
    .from('admin_listing_queue')
    .select('*')
    .in('status', ['PENDING_REVIEW', 'PENDING_MEMBER_APPROVAL'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminListingQueueRecord[];
}

export async function reviewMember(userId: string, decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED', reason?: string) {
  const { error } = await supabase.rpc('admin_review_member', {
    target_user_id: userId,
    decision,
    review_reason: reason?.trim() || null,
  });
  if (error) throw error;
}

export async function reviewListing(
  listingId: string,
  decision: 'PUBLISHED' | 'REJECTED' | 'PAUSED' | 'REMOVED',
  reason?: string,
  previewForPending = false,
) {
  const { error } = await supabase.rpc('admin_review_listing', {
    target_listing_id: listingId,
    decision,
    review_reason: reason?.trim() || null,
    preview_for_pending: previewForPending,
  });
  if (error) throw error;
}
