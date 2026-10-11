import { loadLodgeOperationalData } from '@/lib/lodgeRepository';
import { supabase } from '@/lib/supabase';
import { Announcement, Charge, FinancialEntry, LodgeEvent, LodgeMember, Poll } from '@/types';

export type HydratedLodgeData = {
  members: LodgeMember[];
  announcements: Announcement[];
  events: LodgeEvent[];
  polls: Poll[];
  financialEntries: FinancialEntry[];
  charges: Charge[];
};

export async function hydrateLodgeData(lodgeId: string): Promise<HydratedLodgeData | null> {
  if (!supabase) return null;

  const operational = await loadLodgeOperationalData(lodgeId);
  if (!operational) return null;

  const membershipsResult = await supabase
    .from('lodge_memberships')
    .select('member_id,role,status')
    .eq('lodge_id', lodgeId);
  if (membershipsResult.error) throw membershipsResult.error;

  const memberships = membershipsResult.data ?? [];
  const memberIds = memberships.map((item) => item.member_id);
  const profilesResult = memberIds.length
    ? await supabase.from('member_profiles').select('id,full_name,email,phone').in('id', memberIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;

  const profiles = new Map((profilesResult.data ?? []).map((item) => [item.id, item]));
  const members: LodgeMember[] = memberships.map((item) => {
    const profile = profiles.get(item.member_id);
    return {
      id: item.member_id,
      name: profile?.full_name ?? 'Membro Connexio',
      email: profile?.email ?? '',
      whatsapp: profile?.phone ?? undefined,
      role: item.role,
      status: item.status,
    };
  });

  const announcements: Announcement[] = operational.announcements.map((row) => ({
    id: row.id,
    lodgeId: row.lodge_id,
    title: row.title,
    message: row.message,
    priority: row.priority,
    pushRequested: row.push_requested,
    createdAt: row.created_at,
  }));

  const attendeeMap = new Map<string, string[]>();
  operational.attendees.forEach((row) => {
    const current = attendeeMap.get(row.event_id) ?? [];
    current.push(row.member_id);
    attendeeMap.set(row.event_id, current);
  });
  const events: LodgeEvent[] = operational.events.map((row) => ({
    id: row.id,
    lodgeId: row.lodge_id,
    title: row.title,
    description: row.description ?? undefined,
    startsAt: row.starts_at,
    location: row.location ?? undefined,
    requiresRegistration: row.requires_registration,
    attendeeIds: attendeeMap.get(row.id) ?? [],
  }));

  const optionMap = new Map<string, typeof operational.options>();
  operational.options.forEach((row) => optionMap.set(row.poll_id, [...(optionMap.get(row.poll_id) ?? []), row]));
  const voteMap = new Map<string, number>();
  operational.votes.forEach((row) => voteMap.set(row.option_id, (voteMap.get(row.option_id) ?? 0) + 1));
  const polls: Poll[] = operational.polls.map((row) => {
    const options = (optionMap.get(row.id) ?? []).map((option) => ({ id: option.id, label: option.label, votes: voteMap.get(option.id) ?? 0 }));
    return { id: row.id, lodgeId: row.lodge_id, question: row.question, options, closesAt: row.closes_at ?? undefined, active: row.active, totalVotes: options.reduce((sum, option) => sum + option.votes, 0) };
  });

  const today = new Date().toISOString().slice(0, 10);
  const financialEntries: FinancialEntry[] = operational.finance.map((row) => ({
    id: row.id,
    lodgeId: row.lodge_id,
    type: row.direction,
    description: row.description,
    category: row.category ?? '',
    amount: Number(row.amount_cents) / 100,
    dueDate: row.due_date,
    status: row.status === 'PAID' ? 'PAID' : row.due_date < today ? 'OVERDUE' : 'OPEN',
    recurring: row.recurring,
    attachmentName: row.attachment_path ?? undefined,
    paidAt: row.paid_at ?? undefined,
  }));

  const charges: Charge[] = operational.charges.map((row) => ({
    id: row.id,
    lodgeId: row.lodge_id,
    memberId: row.member_id ?? undefined,
    memberName: row.member_name,
    description: row.description,
    amount: Number(row.amount_cents) / 100,
    dueDate: row.due_date,
    status: row.status === 'CANCELED' || row.status === 'EXPIRED' ? 'CANCELLED' : row.status,
    pixReference: row.provider_reference ?? undefined,
  }));

  return { members, announcements, events, polls, financialEntries, charges };
}
