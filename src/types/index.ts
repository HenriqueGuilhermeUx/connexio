export type ListingType = 'SERVICE' | 'PRODUCT';
export type PriceType = 'FIXED' | 'FROM' | 'ON_REQUEST';
export type MemberStatus = 'GUEST' | 'PENDING' | 'APPROVED';
export type LodgePlan = 'FREE' | 'PRO';
export type LodgeRole = 'MEMBER' | 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type ManagementRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

export type LodgeMember = {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  role: LodgeRole;
  status: MembershipStatus;
};

export type ManagementRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  lodgeName: string;
  lodgeNumber?: string;
  orient: string;
  region: string;
  requestedRole: Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>;
  evidenceName: string;
  evidenceType: 'POSSESSION_TERM' | 'APPOINTMENT' | 'OTHER';
  notes?: string;
  status: ManagementRequestStatus;
  createdAt: string;
  decidedAt?: string;
};

export type MemberCredential = {
  memberId: string;
  membershipId: string;
  lodgeId: string;
  issuedAt: string;
  version: number;
};
