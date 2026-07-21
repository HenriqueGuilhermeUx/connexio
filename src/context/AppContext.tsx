import { demoMember, initialListings } from '@/data/mock';
import { Listing, Member, MemberStatus } from '@/types';
import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

type NewListing = Omit<
  Listing,
  'id' | 'ownerId' | 'ownerName' | 'ownerLodge' | 'ownerVerified' | 'phone' | 'createdAt'
>;

type PendingRegistration = Omit<Member, 'id' | 'status' | 'cimMasked'> & {
  cim: string;
  password: string;
};

type AppContextValue = {
  member: Member | null;
  status: MemberStatus;
  listings: Listing[];
  favorites: string[];
  loginDemo: () => void;
  registerPending: (member: PendingRegistration) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  createListing: (listing: NewListing) => Listing;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [member, setMember] = useState<Member | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loginDemo = () => setMember(demoMember);

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
  };

  const logout = () => {
    setMember(null);
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

  const value: AppContextValue = {
    member,
    status: member?.status ?? 'GUEST',
    listings,
    favorites,
    loginDemo,
    registerPending,
    logout,
    toggleFavorite,
    createListing,
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
