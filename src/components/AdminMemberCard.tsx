import { AdminActions, AdminDecisionCard } from '@/components/AdminDecisionCard';
import { AdminDataBox } from '@/components/AdminDataBox';
import { AdminReasonField } from '@/components/AdminReasonField';
import { DataRow } from '@/components/DataRow';
import { AdminMemberQueueRecord } from '@/types/database';
import { useState } from 'react';

type MemberWithLodge = AdminMemberQueueRecord & {
  lodge_name?: string | null;
  lodge_number?: string | null;
  obedience?: string | null;
  event_email_opt_in?: boolean;
};

export function AdminMemberCard({
  member,
  busy,
  onDecision,
}: {
  member: MemberWithLodge;
  busy?: 'APPROVED' | 'REJECTED';
  onDecision: (decision: 'APPROVED' | 'REJECTED', reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const lodge = member.lodge_name
    ? `${member.lodge_name}${member.lodge_number ? ` nº ${member.lodge_number}` : ''}`
    : 'Não informada';

  return (
    <AdminDecisionCard title={member.full_name || 'Membro Connexio'} subtitle={member.email}>
      <AdminDataBox>
        <DataRow label="CIM" value={member.cim_number} />
        <DataRow label="Loja" value={lodge} />
        <DataRow label="Potência / Obediência" value={member.obedience || 'Não informada'} />
        <DataRow label="Telefone" value={member.phone} />
        <DataRow label="Oriente / Estado" value={[member.city, member.region].filter(Boolean).join(' · ')} />
        <DataRow label="Eventos por e-mail" value={member.event_email_opt_in ? 'Autorizado' : 'Não autorizado'} />
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
