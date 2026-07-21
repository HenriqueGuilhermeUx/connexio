export type ListingType = 'BUSINESS' | 'SERVICE' | 'PRODUCT';
export type PriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type MemberStatus = 'GUEST' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_MEMBER_APPROVAL'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'REMOVED';

export type Listing = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerLodge: string;
  ownerVerified: boolean;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  categorySlug?: string;
  city: string;
  region: string;
  price?: number;
  priceType: PriceType;
  benefit?: string;
  website?: string;
  contactEmail?: string;
  phone: string;
  imageUrl?: string;
  status?: ListingStatus;
  isPreview?: boolean;
  createdAt: string;
  featured?: boolean;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  region: string;
  lodge: string;
  cimMasked: string;
  status: MemberStatus;
};
