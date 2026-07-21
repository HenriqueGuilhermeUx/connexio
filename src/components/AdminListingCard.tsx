import { AdminActions, AdminDecisionCard } from '@/components/AdminDecisionCard';
import { AdminDataBox } from '@/components/AdminDataBox';
import { AdminPreviewToggle } from '@/components/AdminPreviewToggle';
import { AdminReasonField } from '@/components/AdminReasonField';
import { DataRow } from '@/components/DataRow';
import { AdminListingQueueRecord } from '@/types/database';
import { useState } from 'react';

export function AdminListingCard({
  listing,
  busy,
  onDecision,
}: {
  listing: AdminListingQueueRecord;
  busy?: 'PUBLISHED' | 'REJECTED';
  onDecision: (decision: 'PUBLISHED' | 'REJECTED', reason: string, preview: boolean) => void;
}) {
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState(false);
  return (
    <AdminDecisionCard title={listing.title} subtitle={`${listing.owner_name} · ${listing.owner_email}`}>
      <AdminDataBox>
        <DataRow label="Tipo" value={listing.type === 'BUSINESS' ? 'Loja / negócio' : listing.type === 'SERVICE' ? 'Serviço' : 'Produto'} />
        <DataRow label="Segmento" value={listing.category_name} />
        <DataRow label="Local" value={[listing.city, listing.region].filter(Boolean).join(' · ')} />
        <DataRow label="Imagens" value={String(listing.image_count || 0)} />
        <DataRow label="Status" value={listing.status} />
      </AdminDataBox>
      <DataRow label="Descrição" value={listing.description} />
      <AdminPreviewToggle value={preview} onChange={setPreview} />
      <AdminReasonField value={reason} onChangeText={setReason} />
      <AdminActions
        approveLabel="Publicar"
        onReject={() => onDecision('REJECTED', reason, false)}
        onApprove={() => onDecision('PUBLISHED', reason, preview)}
        rejecting={busy === 'REJECTED'}
        approving={busy === 'PUBLISHED'}
      />
    </AdminDecisionCard>
  );
}
