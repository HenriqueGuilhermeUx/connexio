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
export type EventStatus = 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED';
export type EventScope = 'CITY' | 'REGION' | 'STATE' | 'NETWORK';

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
  lodgeNumber?: string;
  obedience?: string;
  eventEmailOptIn?: boolean;
  cimMasked: string;
  status: MemberStatus;
};

export type BlockedMember = {
  id: string;
  name: string;
  createdAt: string;
};

export type ConnexioEvent = {
  id: string;
  organizerId: string;
  organizerName: string;
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
  imageUrl?: string;
  imagePath?: string;
  status: EventStatus;
  featured: boolean;
  createdAt: string;
};
