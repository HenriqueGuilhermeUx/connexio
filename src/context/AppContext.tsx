import { demoLodge, demoMember, demoMembership, initialListings } from '@/data/mock';
import { signInConnexio } from '@/lib/auth';
import { hydrateLodgeData } from '@/lib/lodgeHydration';
import {
  persistAnnouncement,
  persistCharge,
  persistEventAttendance,
  persistFinancialEntry,
  persistFinancialEntryPaid,
  persistLodgeEvent,
  persistPoll,
  persistPollVote,
} from '@/lib/lodgeRepository';
import { supabase } from '@/lib/supabase';
import {
  Announcement,
  Charge,
  FinancialEntry,
  Listing,
  Lodge,
  LodgeEvent,
  LodgeMember,
  LodgeRole,
  ManagementRequest,
  Membership,
  Member,
  MemberStatus,
  Poll,
} from '@/types';
import React, { createContext, PropsWithChildren, useContext, useRef, useState } from 'react';

type NewListing = Omit<Listing, 'id' | 'ownerId' | 'ownerName' | 'ownerLodge' | 'ownerVerified' | 'phone' | 'createdAt'>;
type NewManagementRequest = Omit<ManagementRequest, 'id' | 'requesterId' | 'requesterName' | 'requesterEmail' | 'status' | 'createdAt'>;
type NewLodgeMember = Omit<LodgeMember, 'id' | 'status'>;
type NewAnnouncement = Omit<Announcement, 'id' | 'lodgeId' | 'createdAt'>;
type NewLodgeEvent = Omit<LodgeEvent, 'id' | 'lodgeId' | 'attendeeIds'>;
type NewFinancialEntry = Omit<FinancialEntry, 'id' | 'lodgeId' | 'status' | 'paidAt'>;
type NewCharge = Omit<Charge, 'id' | 'lodgeId' | 'status' | 'pixReference'>;

type AppContextValue = {
  member: Member | null;
  status: MemberStatus;
  lodge: Lodge | null;
  membership: Membership | null;
  lodgeMembers: LodgeMember[];
  managementRequests: ManagementRequest[];
  announcements: Announcement[];
  lodgeEvents: LodgeEvent[];
  polls: Poll[];
  financialEntries: FinancialEntry[];
  charges: Charge[];
  listings: Listing[];
  favorites: string[];
  loginDemo: () => void;
  loginWithCredentials: (email: string, password: string) => Promise<'REMOTE' | 'DEMO'>;
  registerPending: (member: Omit<Member, 'id' | 'status' | 'cimMasked'> & { cim: string }) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  createListing: (listing: NewListing) => Listing;
  submitManagementRequest: (request: NewManagementRequest) => ManagementRequest;
  decideManagementRequest: (requestId: string, approved: boolean) => void;
  addLodgeMember: (newMember: NewLodgeMember) => LodgeMember;
  updateLodgeMemberRole: (memberId: string, role: LodgeRole) => void;
  createAnnouncement: (announcement: NewAnnouncement) => Announcement;
  createLodgeEvent: (event: NewLodgeEvent) => LodgeEvent;
  toggleEventAttendance: (eventId: string) => void;
  createPoll: (question: string, optionLabels: string[], closesAt?: string) => Poll;
  votePoll: (pollId: string, optionId: string) => void;
  createFinancialEntry: (entry: NewFinancialEntry) => FinancialEntry;
  markFinancialEntryPaid: (entryId: string) => void;
  createCharge: (charge: NewCharge) => Charge;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const initialLodgeMembers: LodgeMember[] = [
  { id: demoMember.id, name: demoMember.name, email: demoMember.email, whatsapp: demoMember.whatsapp, role: demoMembership.role, status: 'ACTIVE' },
  { id: 'member-roberto-lodge', name: 'Roberto Almeida', email: 'roberto@exemplo.com', whatsapp: '5513998877665', role: 'SECRETARY', status: 'ACTIVE' },
  { id: 'member-paulo-lodge', name: 'Paulo Mendes', email: 'paulo@exemplo.com', whatsapp: '5513997766554', role: 'TREASURER', status: 'ACTIVE' },
];

const initialAnnouncements: Announcement[] = [
  { id: 'announcement-1', lodgeId: demoLodge.id, title: 'Sessão desta quinta-feira', message: 'Lembramos a todos que a sessão começa às 20h. Chegada recomendada às 19h30.', priority: 'IMPORTANT', pushRequested: true, createdAt: '2026-08-18T14:00:00.000Z' },
];

const initialEvents: LodgeEvent[] = [
  { id: 'event-1', lodgeId: demoLodge.id, title: 'Sessão ordinária', description: 'Sessão regular da Loja.', startsAt: '2026-08-27T20:00:00.000Z', location: 'Templo da Loja', requiresRegistration: false, attendeeIds: [] },
];

const initialPolls: Poll[] = [
  { id: 'poll-1', lodgeId: demoLodge.id, question: 'Qual data é melhor para o jantar da Loja?', options: [{ id: 'poll-1-a', label: '12 de setembro', votes: 8 }, { id: 'poll-1-b', label: '19 de setembro', votes: 5 }], active: true, totalVotes: 13 },
];

const initialFinancialEntries: FinancialEntry[] = [
  { id: 'financial-1', lodgeId: demoLodge.id, type: 'PAYABLE', description: 'Energia elétrica', category: 'Utilidades', amount: 486.2, dueDate: '2026-08-25', status: 'OPEN', recurring: true },
  { id: 'financial-2', lodgeId: demoLodge.id, type: 'RECEIVABLE', description: 'Mensalidades de agosto', category: 'Mensalidades', amount: 3250, dueDate: '2026-08-10', status: 'OPEN', recurring: true },
];

const initialCharges: Charge[] = [
  { id: 'charge-1', lodgeId: demoLodge.id, memberId: 'member-roberto-lodge', memberName: 'Roberto Almeida', description: 'Mensalidade agosto', amount: 150, dueDate: '2026-08-10', status: 'PENDING' },
];

export function AppProvider({ children }: PropsWithChildren) {
  const [member, setMember] = useState<Member | null>(null);
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [lodgeMembers, setLodgeMembers] = useState<LodgeMember[]>(initialLodgeMembers);
  const [managementRequests, setManagementRequests] = useState<ManagementRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [lodgeEvents, setLodgeEvents] = useState<LodgeEvent[]>(initialEvents);
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(initialFinancialEntries);
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const remoteIds = useRef(new Map<string, string>());

  const rememberRemoteId = (localId: string, remoteId: string | null | undefined) => {
    if (remoteId) remoteIds.current.set(localId, remoteId);
  };

  const persistQuietly = (task: Promise<unknown>) => {
    void task.catch((error) => {
      if (__DEV__) console.warn('[Connexio persistence]', error);
    });
  };

  const clearLodgeState = () => {
    setLodgeMembers([]);
    setAnnouncements([]);
    setLodgeEvents([]);
    setPolls([]);
    setFinancialEntries([]);
    setCharges([]);
    remoteIds.current.clear();
  };

  const loginDemo = () => {
    setMember(demoMember);
    setLodge(demoLodge);
    setMembership(demoMembership);
    setLodgeMembers(initialLodgeMembers);
    setAnnouncements(initialAnnouncements);
    setLodgeEvents(initialEvents);
    setPolls(initialPolls);
    setFinancialEntries(initialFinancialEntries);
    setCharges(initialCharges);
  };

  const loginWithCredentials: AppContextValue['loginWithCredentials'] = async (email, password) => {
    const authenticated = await signInConnexio(email, password);
    if (!authenticated) {
      loginDemo();
      return 'DEMO';
    }

    setMember(authenticated.member);
    setLodge(authenticated.lodge);
    setMembership(authenticated.membership);
    clearLodgeState();

    if (authenticated.lodge) {
      try {
        const hydrated = await hydrateLodgeData(authenticated.lodge.id);
        if (hydrated) {
          setLodgeMembers(hydrated.members);
          setAnnouncements(hydrated.announcements);
          setLodgeEvents(hydrated.events);
          setPolls(hydrated.polls);
          setFinancialEntries(hydrated.financialEntries);
          setCharges(hydrated.charges);
        }
      } catch (error) {
        if (__DEV__) console.warn('[Connexio hydration]', error);
      }
    }

    return 'REMOTE';
  };

  const registerPending: AppContextValue['registerPending'] = (form) => {
    setMember({ id: `member-${Date.now()}`, name: form.name, email: form.email, whatsapp: form.whatsapp, city: form.city, region: form.region, lodge: form.lodge, cimMasked: `•••• ${form.cim.slice(-4)}`, status: 'PENDING' });
    setLodge(null); setMembership(null); clearLodgeState();
  };

  const logout = () => {
    setMember(null); setLodge(null); setMembership(null); setFavorites([]); clearLodgeState();
    if (supabase) void supabase.auth.signOut();
  };

  const toggleFavorite = (listingId: string) => setFavorites((current) => current.includes(listingId) ? current.filter((id) => id !== listingId) : [...current, listingId]);

  const createListing: AppContextValue['createListing'] = (form) => {
    const owner = member ?? demoMember;
    const listing: Listing = { ...form, id: `listing-${Date.now()}`, ownerId: owner.id, ownerName: owner.name, ownerLodge: owner.lodge, ownerVerified: owner.status === 'APPROVED', phone: owner.whatsapp, createdAt: new Date().toISOString() };
    setListings((current) => [listing, ...current]); return listing;
  };

  const submitManagementRequest: AppContextValue['submitManagementRequest'] = (form) => {
    const requester = member ?? demoMember;
    const request: ManagementRequest = { ...form, id: `management-${Date.now()}`, requesterId: requester.id, requesterName: requester.name, requesterEmail: requester.email, status: 'PENDING', createdAt: new Date().toISOString() };
    setManagementRequests((current) => [request, ...current]); return request;
  };

  const decideManagementRequest: AppContextValue['decideManagementRequest'] = (requestId, approved) => {
    const request = managementRequests.find((item) => item.id === requestId); if (!request) return;
    const decidedAt = new Date().toISOString();
    setManagementRequests((current) => current.map((item) => item.id === requestId ? { ...item, status: approved ? 'APPROVED' : 'REJECTED', decidedAt } : item));
    if (approved && member?.id === request.requesterId) {
      const approvedLodge: Lodge = { id: `lodge-${request.id}`, name: request.lodgeName, number: request.lodgeNumber, orient: request.orient, region: request.region, plan: 'FREE', verified: true };
      setLodge(approvedLodge);
      setMembership({ id: `membership-${request.id}`, memberId: request.requesterId, lodgeId: approvedLodge.id, role: request.requestedRole, status: 'ACTIVE', verifiedAt: decidedAt });
    }
  };

  const addLodgeMember: AppContextValue['addLodgeMember'] = (form) => {
    const newMember: LodgeMember = { ...form, id: `lodge-member-${Date.now()}`, status: 'ACTIVE' };
    setLodgeMembers((current) => [newMember, ...current]); return newMember;
  };

  const updateLodgeMemberRole: AppContextValue['updateLodgeMemberRole'] = (memberId, role) => setLodgeMembers((current) => current.map((item) => item.id === memberId ? { ...item, role } : item));

  const createAnnouncement: AppContextValue['createAnnouncement'] = (form) => {
    const lodgeId = lodge?.id ?? demoLodge.id;
    const announcement: Announcement = { ...form, id: `announcement-${Date.now()}`, lodgeId, createdAt: new Date().toISOString() };
    setAnnouncements((current) => [announcement, ...current]);
    persistQuietly(persistAnnouncement(lodgeId, form));
    return announcement;
  };

  const createLodgeEvent: AppContextValue['createLodgeEvent'] = (form) => {
    const lodgeId = lodge?.id ?? demoLodge.id;
    const event: LodgeEvent = { ...form, id: `event-${Date.now()}`, lodgeId, attendeeIds: [] };
    setLodgeEvents((current) => [event, ...current]);
    persistQuietly(persistLodgeEvent(lodgeId, form).then((remote) => rememberRemoteId(event.id, remote?.id)));
    return event;
  };

  const toggleEventAttendance: AppContextValue['toggleEventAttendance'] = (eventId) => {
    if (!member) return;
    const currentEvent = lodgeEvents.find((event) => event.id === eventId);
    const attending = !currentEvent?.attendeeIds.includes(member.id);
    setLodgeEvents((current) => current.map((event) => event.id !== eventId ? event : { ...event, attendeeIds: event.attendeeIds.includes(member.id) ? event.attendeeIds.filter((id) => id !== member.id) : [...event.attendeeIds, member.id] }));
    persistQuietly(persistEventAttendance(remoteIds.current.get(eventId) ?? eventId, attending));
  };

  const createPoll: AppContextValue['createPoll'] = (question, optionLabels, closesAt) => {
    const id = `poll-${Date.now()}`;
    const lodgeId = lodge?.id ?? demoLodge.id;
    const poll: Poll = { id, lodgeId, question, options: optionLabels.map((label, index) => ({ id: `${id}-${index}`, label, votes: 0 })), closesAt, active: true, totalVotes: 0 };
    setPolls((current) => [poll, ...current]);
    persistQuietly(persistPoll(lodgeId, question, optionLabels, closesAt).then((remoteId) => rememberRemoteId(id, remoteId)));
    return poll;
  };

  const votePoll: AppContextValue['votePoll'] = (pollId, optionId) => {
    setPolls((current) => current.map((poll) => poll.id !== pollId ? poll : { ...poll, totalVotes: poll.totalVotes + 1, options: poll.options.map((option) => option.id === optionId ? { ...option, votes: option.votes + 1 } : option) }));
    const remotePollId = remoteIds.current.get(pollId) ?? pollId;
    const optionIndex = polls.find((poll) => poll.id === pollId)?.options.findIndex((option) => option.id === optionId) ?? -1;
    if (optionIndex >= 0 && remotePollId !== pollId) return;
    persistQuietly(persistPollVote(remotePollId, optionId));
  };

  const createFinancialEntry: AppContextValue['createFinancialEntry'] = (form) => {
    const lodgeId = lodge?.id ?? demoLodge.id;
    const entry: FinancialEntry = { ...form, id: `financial-${Date.now()}`, lodgeId, status: 'OPEN' };
    setFinancialEntries((current) => [entry, ...current]);
    persistQuietly(persistFinancialEntry(lodgeId, form).then((remoteId) => rememberRemoteId(entry.id, remoteId)));
    return entry;
  };

  const markFinancialEntryPaid: AppContextValue['markFinancialEntryPaid'] = (entryId) => {
    setFinancialEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, status: 'PAID', paidAt: new Date().toISOString() } : entry));
    persistQuietly(persistFinancialEntryPaid(remoteIds.current.get(entryId) ?? entryId));
  };

  const createCharge: AppContextValue['createCharge'] = (form) => {
    const lodgeId = lodge?.id ?? demoLodge.id;
    const charge: Charge = { ...form, id: `charge-${Date.now()}`, lodgeId, status: 'DRAFT' };
    setCharges((current) => [charge, ...current]);
    persistQuietly(persistCharge(lodgeId, form).then((remoteId) => rememberRemoteId(charge.id, remoteId)));
    return charge;
  };

  const value: AppContextValue = { member, status: member?.status ?? 'GUEST', lodge, membership, lodgeMembers, managementRequests, announcements, lodgeEvents, polls, financialEntries, charges, listings, favorites, loginDemo, loginWithCredentials, registerPending, logout, toggleFavorite, createListing, submitManagementRequest, decideManagementRequest, addLodgeMember, updateLodgeMemberRole, createAnnouncement, createLodgeEvent, toggleEventAttendance, createPoll, votePoll, createFinancialEntry, markFinancialEntryPaid, createCharge };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
