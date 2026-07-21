import { AdminActions, AdminDecisionCard } from '@/components/AdminDecisionCard';
import { AdminDataBox } from '@/components/AdminDataBox';
import { AdminReasonField } from '@/components/AdminReasonField';
import { DataRow } from '@/components/DataRow';
import { AdminMemberQueueRecord } from '@/types/database';
import { useState } from 'react';

export function AdminMemberCard({
  member,
  busy,
  onDecision,
}: {
  member: AdminMemberQueueRecord;
  busy?: 'APPROVED' | 'REJECTED';
  onDecision: (decision: 'APPROVED' | 'REJECTED', reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <AdminDecisionCard title={member.full_name || 'Membro Connexio'} subtitle={member.email}>
      <AdminDataBox>
        <DataRow label="CIM" value={member.cim_number} />
        <DataRow label="Telefone" value={member.phone} />
        <DataRow label="Cidade" value={[member.city, member.region].filter(Boolean).join(' · ')} />
        <DataRow label="Ofertas salvas" value={String(member.pending_offers || 0)} />
        <DataRow label="Cadastro" value={new Date(member.submitted_at).toLocaleString('pt-BR')} />
      </AdminDataBox>
      <AdminReasonField value={reason} onChangeText={setReason} />
      <AdminActions
        onReject={() => onDecision('REJECTED', reason)}
        onApprove={() => onDecision('APPROVED', reason)}
        rejecting={busy === 'REJECTED'}
        approving={busy === 'APPROVED'}
      />
    </AdminDecisionCard>
  );
}
