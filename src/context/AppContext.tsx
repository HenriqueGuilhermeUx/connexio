import {
  createListing as persistListing,
  ListingDraftInput,
  loadCatalog,
  loadCategories,
  loadFavoriteIds,
  PickedImage,
  setFavorite,
} from '@/lib/catalog';
import { isCurrentUserAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { CategoryRecord } from '@/types/database';
import { Listing, Member, MemberStatus } from '@/types';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

type PendingRegistration = {
  name: string;
  email: string;
  whatsapp: string;
  cim: string;
};

type AppContextValue = {
  member: Member | null;
  status: MemberStatus;
  sessionLoading: boolean;
  dataLoading: boolean;
  isAdmin: boolean;
  listings: Listing[];
  categories: CategoryRecord[];
  favorites: string[];
  login: (email: string, password: string) => Promise<Member>;
  registerPending: (member: PendingRegistration) => void;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  createListing: (listing: ListingDraftInput, images?: PickedImage[]) => Promise<string>;
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
  const [dataLoading, setDataLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadMember = useCallback(async (userId: string, fallbackEmail = '') => {
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
      lodge: 'Loja a confirmar',
      cimMasked: verification?.cim_last4 ? `•••• ${verification.cim_last4}` : 'Em validação',
      status: mapStatus(profile.status),
    };

    setMember(loaded);
    return loaded;
  }, []);

  const refreshData = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setListings([]);
      setCategories([]);
      setFavorites([]);
      setIsAdmin(false);
      return;
    }

    setDataLoading(true);
    try {
      const [loadedCategories, loadedListings, loadedFavorites, admin] = await Promise.all([
        loadCategories(),
        loadCatalog(),
        loadFavoriteIds(),
        isCurrentUserAdmin(),
      ]);
      setCategories(loadedCategories);
      setListings(loadedListings);
      setFavorites(loadedFavorites);
      setIsAdmin(admin);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      try {
        if (active && data.session?.user) {
          await loadMember(data.session.user.id, data.session.user.email ?? '');
          await refreshData();
        }
      } finally {
        if (active) setSessionLoading(false);
      }
    };

    void restore();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setMember(null);
        setListings([]);
        setCategories([]);
        setFavorites([]);
        setIsAdmin(false);
        setSessionLoading(false);
        return;
      }

      setTimeout(() => {
        void (async () => {
          try {
            await loadMember(session.user.id, session.user.email ?? '');
            await refreshData();
          } finally {
            if (active) setSessionLoading(false);
          }
        })();
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadMember, refreshData]);

  const login: AppContextValue['login'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Conta não encontrada.');
    const loaded = await loadMember(data.user.id, data.user.email ?? email);
    await refreshData();
    return loaded;
  };

  const registerPending: AppContextValue['registerPending'] = (form) => {
    setMember({
      id: `pending-${Date.now()}`,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
      city: '',
      region: '',
      lodge: 'Loja a confirmar',
      cimMasked: `•••• ${form.cim.slice(-4)}`,
      status: 'PENDING',
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setListings([]);
    setCategories([]);
    setFavorites([]);
    setIsAdmin(false);
  };

  const toggleFavorite = async (listingId: string) => {
    const willFavorite = !favorites.includes(listingId);
    setFavorites((current) =>
      willFavorite ? [...current, listingId] : current.filter((id) => id !== listingId),
    );
    try {
      await setFavorite(listingId, willFavorite);
    } catch (error) {
      setFavorites((current) =>
        willFavorite ? current.filter((id) => id !== listingId) : [...current, listingId],
      );
      throw error;
    }
  };

  const createListing: AppContextValue['createListing'] = async (form, images = []) => {
    const id = await persistListing(form, images);
    await refreshData();
    return id;
  };

  const value: AppContextValue = {
    member,
    status: member?.status ?? 'GUEST',
    sessionLoading,
    dataLoading,
    isAdmin,
    listings,
    categories,
    favorites,
    login,
    registerPending,
    logout,
    refreshData,
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
