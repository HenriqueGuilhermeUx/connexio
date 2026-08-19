import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Announcement, Charge, FinancialEntry, LodgeEvent } from '@/types';

async function currentUserId() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function persistAnnouncement(lodgeId: string, announcement: Pick<Announcement, 'title' | 'message' | 'priority' | 'pushRequested'>) {
  if (!supabase) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase.from('lodge_announcements').insert({ lodge_id: lodgeId, title: announcement.title, message: announcement.message, priority: announcement.priority, push_requested: announcement.pushRequested, created_by: userId }).select('id,created_at').single();
  if (error) throw error;
  if (announcement.pushRequested) {
    const { error: pushError } = await supabase.functions.invoke('send-lodge-push', { body: { announcement_id: data.id } });
    if (pushError) console.warn('Comunicado salvo; push não enviado nesta tentativa.', pushError.message);
  }
  return data;
}

export async function persistLodgeEvent(lodgeId: string, event: Pick<LodgeEvent, 'title' | 'description' | 'startsAt' | 'location' | 'requiresRegistration'>) {
  if (!supabase) return null;
  const userId = await currentUserId(); if (!userId) return null;
  const { data, error } = await supabase.from('lodge_events').insert({ lodge_id:lodgeId,title:event.title,description:event.description??null,starts_at:event.startsAt,location:event.location??null,requires_registration:event.requiresRegistration,created_by:userId }).select('id,created_at').single();
  if (error) throw error; return data;
}

export async function persistEventAttendance(eventId: string, attending: boolean) {
  if (!supabase) return; const userId=await currentUserId(); if(!userId)return;
  if(attending){const{error}=await supabase.from('lodge_event_attendees').upsert({event_id:eventId,member_id:userId},{onConflict:'event_id,member_id'});if(error)throw error;return;}
  const{error}=await supabase.from('lodge_event_attendees').delete().eq('event_id',eventId).eq('member_id',userId);if(error)throw error;
}

export async function persistPoll(lodgeId:string,question:string,optionLabels:string[],closesAt?:string){if(!supabase)return null;const userId=await currentUserId();if(!userId)return null;const{data:poll,error:pollError}=await supabase.from('lodge_polls').insert({lodge_id:lodgeId,question,closes_at:closesAt??null,active:true,created_by:userId}).select('id').single();if(pollError)throw pollError;const{error:optionError}=await supabase.from('lodge_poll_options').insert(optionLabels.map((label,index)=>({poll_id:poll.id,label,position:index})));if(optionError)throw optionError;return poll.id as string;}
export async function persistPollVote(pollId:string,optionId:string){if(!supabase)return;const userId=await currentUserId();if(!userId)return;const{error}=await supabase.from('lodge_poll_votes').insert({poll_id:pollId,option_id:optionId,member_id:userId});if(error)throw error;}

export async function persistFinancialEntry(lodgeId:string,entry:Pick<FinancialEntry,'type'|'description'|'category'|'amount'|'dueDate'|'recurring'|'attachmentName'>){if(!supabase)return null;const userId=await currentUserId();if(!userId)return null;const{data,error}=await supabase.from('lodge_financial_entries').insert({lodge_id:lodgeId,direction:entry.type,description:entry.description,category:entry.category||null,amount_cents:Math.round(entry.amount*100),due_date:entry.dueDate,status:'OPEN',recurring:entry.recurring,attachment_path:entry.attachmentName??null,created_by:userId}).select('id').single();if(error)throw error;return data.id as string;}
export async function persistFinancialEntryPaid(entryId:string){if(!supabase)return;const{error}=await supabase.from('lodge_financial_entries').update({status:'PAID',paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',entryId);if(error)throw error;}
export async function persistCharge(lodgeId:string,charge:Pick<Charge,'memberId'|'memberName'|'description'|'amount'|'dueDate'>){if(!supabase)return null;const userId=await currentUserId();if(!userId)return null;const{data,error}=await supabase.from('lodge_charges').insert({lodge_id:lodgeId,member_id:charge.memberId??null,member_name:charge.memberName,description:charge.description,amount_cents:Math.round(charge.amount*100),due_date:charge.dueDate,status:'PENDING',created_by:userId}).select('id').single();if(error)throw error;return data.id as string;}

export async function loadLodgeOperationalData(lodgeId:string){if(!supabase)return null;const[announcements,events,attendees,polls,options,votes,finance,charges]=await Promise.all([supabase.from('lodge_announcements').select('*').eq('lodge_id',lodgeId).order('created_at',{ascending:false}),supabase.from('lodge_events').select('*').eq('lodge_id',lodgeId).order('starts_at',{ascending:true}),supabase.from('lodge_event_attendees').select('*'),supabase.from('lodge_polls').select('*').eq('lodge_id',lodgeId).order('created_at',{ascending:false}),supabase.from('lodge_poll_options').select('*').order('position',{ascending:true}),supabase.from('lodge_poll_votes').select('poll_id,option_id'),supabase.from('lodge_financial_entries').select('*').eq('lodge_id',lodgeId).order('due_date',{ascending:true}),supabase.from('lodge_charges').select('*').eq('lodge_id',lodgeId).order('due_date',{ascending:true})]);for(const response of[announcements,events,attendees,polls,options,votes,finance,charges]){if(response.error)throw response.error;}return{announcements:announcements.data??[],events:events.data??[],attendees:attendees.data??[],polls:polls.data??[],options:options.data??[],votes:votes.data??[],finance:finance.data??[],charges:charges.data??[]};}
