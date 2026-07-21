export type ListingType = 'SERVICE' | 'PRODUCT';
export type PriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type MemberStatus = 'GUEST' | 'PENDING' | 'APPROVED';

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
  city: string;
  region: string;
  price?: number;
  priceType: PriceType;
  benefit?: string;
  phone: string;
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
