export type ListingType = 'SERVICE' | 'PRODUCT';
export type PriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type MemberStatus = 'GUEST' | 'PENDING' | 'APPROVED';
export type LodgePlan = 'FREE' | 'PRO';
export type LodgeRole = 'MEMBER' | 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

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

export type Lodge = {
  id: string;
  name: string;
  number?: string;
  orient: string;
  region: string;
  plan: LodgePlan;
  verified: boolean;
};

export type Membership = {
  id: string;
  memberId: string;
  lodgeId: string;
  role: LodgeRole;
  status: MembershipStatus;
  joinedAt?: string;
  verifiedAt?: string;
};

export type MemberCredential = {
  memberId: string;
  membershipId: string;
  lodgeId: string;
  issuedAt: string;
  version: number;
};
