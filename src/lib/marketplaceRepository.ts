import { supabase } from '@/lib/supabase';
import { Listing, ListingType, PriceType } from '@/types';

type ListingRow = {
  id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string;
  category_slug: string;
  city: string | null;
  region: string | null;
  price: number | null;
  price_type: PriceType;
  benefit: string | null;
  status: string;
  is_preview: boolean;
  created_at: string;
};

type ProfileRow = { id: string; full_name: string | null; lodge_name?: string | null; status: string | null };
type CategoryRow = { slug: string; name: string };
type ContactRow = { listing_id: string; whatsapp: string | null };

export async function loadLiveMarketplaceListings(): Promise<Listing[]> {
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id;

  const { data: listings, error } = await supabase
    .from('listings')
    .select('id,owner_id,type,title,description,category_slug,city,region,price,price_type,benefit,status,is_preview,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (listings ?? []) as ListingRow[];
  const visible = rows.filter((row) => row.owner_id === currentUserId || row.status === 'PUBLISHED' || row.is_preview === true);
  if (visible.length === 0) return [];

  const ownerIds = [...new Set(visible.map((row) => row.owner_id))];
  const categorySlugs = [...new Set(visible.map((row) => row.category_slug))];
  const listingIds = visible.map((row) => row.id);

  const [profilesResult, categoriesResult, contactsResult] = await Promise.all([
    supabase.from('profiles').select('id,full_name,lodge_name,status').in('id', ownerIds),
    supabase.from('categories').select('slug,name').in('slug', categorySlugs),
    supabase.from('listing_contacts').select('listing_id,whatsapp').in('listing_id', listingIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (contactsResult.error) throw contactsResult.error;

  const profiles = new Map(((profilesResult.data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const categories = new Map(((categoriesResult.data ?? []) as CategoryRow[]).map((row) => [row.slug, row.name]));
  const contacts = new Map(((contactsResult.data ?? []) as ContactRow[]).map((row) => [row.listing_id, row.whatsapp ?? '']));

  return visible.map((row) => {
    const owner = profiles.get(row.owner_id);
    return {
      id: row.id,
      ownerId: row.owner_id,
      ownerName: owner?.full_name || 'Membro Connexio',
      ownerLodge: owner?.lodge_name || 'Loja não informada',
      ownerVerified: owner?.status === 'APPROVED',
      type: row.type,
      title: row.title,
      description: row.description,
      category: categories.get(row.category_slug) || row.category_slug,
      city: row.city || '',
      region: row.region || '',
      price: row.price ?? undefined,
      priceType: row.price_type,
      benefit: row.benefit ?? undefined,
      phone: contacts.get(row.id) || '',
      createdAt: row.created_at,
    } satisfies Listing;
  });
}
