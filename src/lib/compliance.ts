import { supabase } from '@/lib/supabase';
import { AdminReportQueueRecord, DbReportStatus, ReportReason } from '@/types/database';
import { Platform } from 'react-native';

export async function reportListing(listingId: string, reason: ReportReason, details?: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Entre na sua conta para enviar uma denúncia.');
  const { error } = await supabase.from('listing_reports').upsert({
    listing_id: listingId,
    reporter_id: data.user.id,
    reason,
    details: details?.trim() || null,
    status: 'OPEN',
  }, { onConflict: 'listing_id,reporter_id' });
  if (error) throw error;
}

export async function loadAdminReportQueue() {
  const { data, error } = await supabase
    .from('admin_report_queue')
    .select('*')
    .in('status', ['OPEN', 'REVIEWING'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminReportQueueRecord[];
}

export async function reviewReport(reportId: string, decision: Exclude<DbReportStatus, 'OPEN'>, note?: string) {
  const { error } = await supabase.rpc('admin_review_report', {
    target_report_id: reportId,
    decision,
    review_note: note?.trim() || null,
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/reset-password`
    : 'connexio://reset-password';
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function deleteMyAccount(email: string) {
  const { error } = await supabase.rpc('delete_my_account', { confirm_email: email.trim().toLowerCase() });
  if (error) throw error;
}
