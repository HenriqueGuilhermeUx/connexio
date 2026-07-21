import { demoMember, initialListings } from '@/data/mock';
import { supabase } from '@/lib/supabase';
import { Listing, Member, MemberStatus } from '@/types';
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

type NewListing = Omit<
  Listing,
  'id' | 'ownerId' | 'ownerName' | 'ownerLodge' | 'ownerVerified' | 'phone' | 'createdAt'
>;

type PendingRegistration = {
  name: string;
  email: string;
  whatsapp: string;
  cim: string;
  password: string;
};

type AppContextValue = {
  member: Member | null;
  status: MemberStatus;
  sessionLoading: boolean;
  listings: Listing[];
  favorites: string[];
  login: (email: string, password: string) => Promise<Member>;
  loginDemo: () => void;
  registerPending: (member: PendingRegistration) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  createListing: (listing: NewListing) => Listing;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function mapStatus(status?: string): MemberStatus {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'SUSPENDED') return 'SUSPENDED';
  return 'PENDING';
}

export function AppProvider({ children }: PropsWithChildren) {
  const [member, setMember] = useState<Member | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadMember = async (userId: string, fallbackEmail = '') => {
    const [{ data: profile, error: profileError }, { data: verification }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,email,full_name,phone,city,region,status')
        .eq('id', userId)
        .single(),
      supabase
        .from('member_verifications')
        .select('cim_last4')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (profileError) throw profileError;

    const loaded: Member = {
      id: profile.id,
      name: profile.full_name || 'Membro Connexio',
      email: profile.email || fallbackEmail,
      whatsapp: profile.phone || '',
      city: profile.city || '',
      region: profile.region || '',
      lodge: 'Loja a informar',
      cimMasked: verification?.cim_last4 ? `•••• ${verification.cim_last4}` : 'Em validação',
      status: mapStatus(profile.status),
    };

    setMember(loaded);
    return loaded;
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      try {
        if (active && data.session?.user) {
          await loadMember(data.session.user.id, data.session.user.email ?? '');
        }
      } finally {
        if (active) setSessionLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setMember(null);
        setSessionLoading(false);
        return;
      }
      setTimeout(() => {
        loadMember(session.user.id, session.user.email ?? '')
          .catch(() => undefined)
          .finally(() => setSessionLoading(false));
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login: AppContextValue['login'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Conta não encontrada.');
    return loadMember(data.user.id, data.user.email ?? email);
  };

  const loginDemo = () => setMember(demoMember);

  const registerPending: AppContextValue['registerPending'] = (form) => {
    setMember({
      id: `member-${Date.now()}`,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      city: '',
      region: '',
      lodge: 'Loja a informar',
      cimMasked: `•••• ${form.cim.slice(-4)}`,
      status: 'PENDING',
    });
  };

  const logout = () => {
    void supabase.auth.signOut();
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
    sessionLoading,
    listings,
    favorites,
    login,
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
