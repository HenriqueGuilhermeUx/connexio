export type DbMemberStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type DbListingStatus =
  | 'DRAFT'
  | 'PENDING_MEMBER_APPROVAL'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'REMOVED';
export type DbListingType = 'BUSINESS' | 'SERVICE' | 'PRODUCT';
export type DbPriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type DbReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
export type ReportReason = 'INAPPROPRIATE' | 'MISLEADING' | 'FRAUD' | 'DUPLICATE' | 'OTHER';

export type CategoryRecord = {
  slug: string;
  name: string;
  position: number;
  active: boolean;
};

export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  city: string | null;
  region: string | null;
  avatar_url: string | null;
  status: DbMemberStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingRecord = {
  id: string;
  owner_id: string;
  type: DbListingType;
  title: string;
  description: string;
  category_slug: string;
  city: string | null;
  region: string | null;
  price: number | null;
  price_type: DbPriceType;
  benefit: string | null;
  website: string | null;
  status: DbListingStatus;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ListingImageRecord = {
  id: string;
  listing_id: string;
  storage_path: string;
  position: number;
  created_at: string;
};

export type ListingContactRecord = {
  listing_id: string;
  contact_name: string | null;
  whatsapp: string;
  email: string | null;
};

export type ListingQueryRecord = ListingRecord & {
  profiles: Pick<ProfileRecord, 'full_name' | 'status'> | null;
  categories: Pick<CategoryRecord, 'name'> | null;
  listing_images: ListingImageRecord[] | null;
  listing_contacts: ListingContactRecord[] | null;
};

export type AdminMemberQueueRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string | null;
  region: string | null;
  status: DbMemberStatus;
  created_at: string;
  cim_number: string;
  cim_last4: string;
  submitted_at: string;
  reviewed_at: string | null;
  decision_reason: string | null;
  pending_offers: number;
};

export type AdminListingQueueRecord = {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  type: DbListingType;
  title: string;
  description: string;
  category_slug: string;
  category_name: string;
  city: string | null;
  region: string | null;
  price: number | null;
  price_type: DbPriceType;
  benefit: string | null;
  website: string | null;
  status: DbListingStatus;
  is_preview: boolean;
  created_at: string;
  image_count: number;
};

export type AdminReportQueueRecord = {
  id: string;
  listing_id: string;
  listing_title: string;
  owner_id: string;
  owner_name: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  reason: ReportReason;
  details: string | null;
  status: DbReportStatus;
  created_at: string;
};
