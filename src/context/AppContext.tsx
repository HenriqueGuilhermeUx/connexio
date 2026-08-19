import { demoLodge, demoMember, demoMembership, initialListings } from '@/data/mock';
import {
  Listing,
  Lodge,
  LodgeMember,
  LodgeRole,
  ManagementRequest,
  Membership,
  Member,
  MemberStatus,
} from '@/types';
import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

type NewListing = Omit<
  Listing,
  'id' | 'ownerId' | 'ownerName' | 'ownerLodge' | 'ownerVerified' | 'phone' | 'createdAt'
>;

type NewManagementRequest = Omit<
  ManagementRequest,
  'id' | 'requesterId' | 'requesterName' | 'requesterEmail' | 'status' | 'createdAt'
>;

type NewLodgeMember = Omit<LodgeMember, 'id' | 'status'>;

type AppContextValue = {
  member: Member | null;
  status: MemberStatus;
  lodge: Lodge | null;
  membership: Membership | null;
  lodgeMembers: LodgeMember[];
  managementRequests: ManagementRequest[];
  listings: Listing[];
  favorites: string[];
  loginDemo: () => void;
  registerPending: (member: Omit<Member, 'id' | 'status' | 'cimMasked'> & { cim: string }) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  createListing: (listing: NewListing) => Listing;
  submitManagementRequest: (request: NewManagementRequest) => ManagementRequest;
  decideManagementRequest: (requestId: string, approved: boolean) => void;
  addLodgeMember: (newMember: NewLodgeMember) => LodgeMember;
  updateLodgeMemberRole: (memberId: string, role: LodgeRole) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const initialLodgeMembers: LodgeMember[] = [
  { id: demoMember.id, name: demoMember.name, email: demoMember.email, whatsapp: demoMember.whatsapp, role: demoMembership.role, status: 'ACTIVE' },
  { id: 'member-roberto-lodge', name: 'Roberto Almeida', email: 'roberto@exemplo.com', whatsapp: '5513998877665', role: 'SECRETARY', status: 'ACTIVE' },
  { id: 'member-paulo-lodge', name: 'Paulo Mendes', email: 'paulo@exemplo.com', whatsapp: '5513997766554', role: 'TREASURER', status: 'ACTIVE' },
];

export function AppProvider({ children }: PropsWithChildren) {
  const [member, setMember] = useState<Member | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [lodgeMembers, setLodgeMembers] = useState<LodgeMember[]>(initialLodgeMembers);
  const [managementRequests, setManagementRequests] = useState<ManagementRequest[]>([]);

  const loginDemo = () => {
    setMember(demoMember);
    setLodge(demoLodge);
    setMembership(demoMembership);
  };

  const registerPending: AppContextValue['registerPending'] = (form) => {
    setMember({
      id: `member-${Date.now()}`,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      city: form.city,
      region: form.region,
      lodge: form.lodge,
      cimMasked: `•••• ${form.cim.slice(-4)}`,
      status: 'PENDING',
    });
    setLodge(null);
    setMembership(null);
  };

  const logout = () => {
    setMember(null);
    setLodge(null);
    setMembership(null);
    setFavorites([]);
  };

  const toggleFavorite = (listingId: string) => {
    setFavorites((current) =>
      current.includes(listingId)
        ? current.filter((id) => id !== listingId)
        : [...current, listingId],
    );
  };

  const createListing: AppContextValue['createListing'] = (form) => {
    const owner = member ?? demoMember;
    const listing: Listing = {
      ...form,
      id: `listing-${Date.now()}`,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerLodge: owner.lodge,
      ownerVerified: owner.status === 'APPROVED',
      phone: owner.whatsapp,
      createdAt: new Date().toISOString(),
    };
    setListings((current) => [listing, ...current]);
    return listing;
  };

  const submitManagementRequest: AppContextValue['submitManagementRequest'] = (form) => {
    const requester = member ?? demoMember;
    const request: ManagementRequest = {
      ...form,
      id: `management-${Date.now()}`,
      requesterId: requester.id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setManagementRequests((current) => [request, ...current]);
    return request;
  };

  const decideManagementRequest: AppContextValue['decideManagementRequest'] = (requestId, approved) => {
    const request = managementRequests.find((item) => item.id === requestId);
    if (!request) return;

    const decidedAt = new Date().toISOString();
    setManagementRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? { ...item, status: approved ? 'APPROVED' : 'REJECTED', decidedAt }
          : item,
      ),
    );

    if (approved && member?.id === request.requesterId) {
      const approvedLodge: Lodge = {
        id: `lodge-${request.id}`,
        name: request.lodgeName,
        number: request.lodgeNumber,
        orient: request.orient,
        region: request.region,
        plan: 'FREE',
        verified: true,
      };
      const approvedMembership: Membership = {
        id: `membership-${request.id}`,
        memberId: request.requesterId,
        lodgeId: approvedLodge.id,
        role: request.requestedRole,
        status: 'ACTIVE',
        verifiedAt: decidedAt,
      };
      setLodge(approvedLodge);
      setMembership(approvedMembership);
    }
  };

  const addLodgeMember: AppContextValue['addLodgeMember'] = (form) => {
    const newMember: LodgeMember = {
      ...form,
      id: `lodge-member-${Date.now()}`,
      status: 'ACTIVE',
    };
    setLodgeMembers((current) => [newMember, ...current]);
    return newMember;
  };

  const updateLodgeMemberRole: AppContextValue['updateLodgeMemberRole'] = (memberId, role) => {
    setLodgeMembers((current) => current.map((item) => item.id === memberId ? { ...item, role } : item));
  };

  const value: AppContextValue = {
    member,
    status: member?.status ?? 'GUEST',
    lodge,
    membership,
    lodgeMembers,
    managementRequests,
    listings,
    favorites,
    loginDemo,
    registerPending,
    logout,
    toggleFavorite,
    createListing,
    submitManagementRequest,
    decideManagementRequest,
    addLodgeMember,
    updateLodgeMemberRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
