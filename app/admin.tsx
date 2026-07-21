import { AdminEmpty } from '@/components/AdminEmpty';
import { AdminGuard } from '@/components/AdminGuard';
import { AdminListingCard } from '@/components/AdminListingCard';
import { AdminMemberCard } from '@/components/AdminMemberCard';
import { AdminReportCard } from '@/components/AdminReportCard';
import { AdminSummary } from '@/components/AdminSummary';
import { AdminTab, AdminTabs } from '@/components/AdminTabs';
import { LoadingState } from '@/components/LoadingState';
import { RefreshButton } from '@/components/RefreshButton';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useApp } from '@/context/AppContext';
import {
  loadAdminListingQueue,
  loadAdminMemberQueue,
  reviewListing,
  reviewMember,
} from '@/lib/catalog';
import { loadAdminReportQueue, reviewReport } from '@/lib/compliance';
import { friendlyError } from '@/lib/errors';
import { AdminListingQueueRecord, AdminMemberQueueRecord, AdminReportQueueRecord, DbReportStatus } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function AdminScreen() {
  const { refreshData } = useApp();
  const [tab, setTab] = useState<AdminTab>('MEMBERS');
  const [members, setMembers] = useState<AdminMemberQueueRecord[]>([]);
  const [listings, setListings] = useState<AdminListingQueueRecord[]>([]);
  const [reports, setReports] = useState<AdminReportQueueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ id: string; decision: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memberQueue, listingQueue, reportQueue] = await Promise.all([
        loadAdminMemberQueue(),
        loadAdminListingQueue(),
        loadAdminReportQueue(),
      ]);
      setMembers(memberQueue);
      setListings(listingQueue);
      setReports(reportQueue);
    } catch (error) {
      Alert.alert('Não foi possível carregar o painel', friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decideMember = async (member: AdminMemberQueueRecord, decision: 'APPROVED' | 'REJECTED', reason: string) => {
    setBusy({ id: member.id, decision });
    try {
      await reviewMember(member.id, decision, reason);
      await Promise.all([load(), refreshData()]);
      Alert.alert(decision === 'APPROVED' ? 'Membro aprovado' : 'Cadastro rejeitado', member.full_name);
    } catch (error) {
      Alert.alert('Não foi possível registrar a decisão', friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  const decideListing = async (
    listing: AdminListingQueueRecord,
    decision: 'PUBLISHED' | 'REJECTED',
    reason: string,
    preview: boolean,
  ) => {
    setBusy({ id: listing.id, decision });
    try {
      await reviewListing(listing.id, decision, reason, preview);
      await Promise.all([load(), refreshData()]);
      Alert.alert(decision === 'PUBLISHED' ? 'Oferta publicada' : 'Oferta rejeitada', listing.title);
    } catch (error) {
      Alert.alert('Não foi possível registrar a decisão', friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  const decideReport = async (report: AdminReportQueueRecord, decision: 'RESOLVED' | 'DISMISSED', note: string) => {
    setBusy({ id: report.id, decision });
    try {
      await reviewReport(report.id, decision, note);
      await load();
      Alert.alert(decision === 'RESOLVED' ? 'Denúncia resolvida' : 'Denúncia arquivada', report.listing_title);
    } catch (error) {
      Alert.alert('Não foi possível registrar a decisão', friendlyError(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <AdminGuard>
        <View style={styles.heading}>
          <ScreenTitle eyebrow="OPERAÇÃO" title="Validação e moderação" subtitle="Aprove membros, publique ofertas e trate denúncias com trilha de auditoria." />
          <RefreshButton loading={loading} onPress={() => void load()} />
        </View>
        <AdminSummary members={members.length} listings={listings.length} reports={reports.length} />
        <AdminTabs selected={tab} onSelect={setTab} members={members.length} listings={listings.length} reports={reports.length} />

        {loading ? (
          <LoadingState label="Carregando fila administrativa..." />
        ) : tab === 'MEMBERS' ? (
          <View style={styles.list}>
            {members.length ? members.map((member) => (
              <AdminMemberCard
                key={member.id}
                member={member}
                busy={busy?.id === member.id ? busy.decision as 'APPROVED' | 'REJECTED' : undefined}
                onDecision={(decision, reason) => void decideMember(member, decision, reason)}
              />
            )) : <AdminEmpty label="Não há cadastros aguardando validação." />}
          </View>
        ) : tab === 'LISTINGS' ? (
          <View style={styles.list}>
            {listings.length ? listings.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                busy={busy?.id === listing.id ? busy.decision as 'PUBLISHED' | 'REJECTED' : undefined}
                onDecision={(decision, reason, preview) => void decideListing(listing, decision, reason, preview)}
              />
            )) : <AdminEmpty label="Não há ofertas aguardando moderação." />}
          </View>
        ) : (
          <View style={styles.list}>
            {reports.length ? reports.map((report) => (
              <AdminReportCard
                key={report.id}
                report={report}
                busy={busy?.id === report.id ? busy.decision as DbReportStatus : undefined}
                onDecision={(decision, note) => void decideReport(report, decision, note)}
              />
            )) : <AdminEmpty label="Não há denúncias aguardando análise." />}
          </View>
        )}
      </AdminGuard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  heading: { gap: 14 },
  list: { gap: 14 },
});
