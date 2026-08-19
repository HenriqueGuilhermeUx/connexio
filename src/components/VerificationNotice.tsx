import { StatusBanner } from '@/components/StatusBanner';
import { MemberStatus } from '@/types';

export function VerificationNotice({ status }: { status: MemberStatus }) {
  if (status === 'APPROVED' || status === 'GUEST') return null;
  if (status === 'REJECTED') {
    return <StatusBanner tone="warning" title="Cadastro não aprovado" description="Consulte a administração para pedir uma revisão." />;
  }
  if (status === 'SUSPENDED') {
    return <StatusBanner tone="warning" title="Acesso suspenso" description="Seus contatos e ofertas públicas estão temporariamente indisponíveis." />;
  }
  return (
    <StatusBanner
      tone="warning"
      title="Validação em andamento"
      description="Você já pode pesquisar a vitrine e cadastrar ofertas completas. Contatos e publicação pública serão liberados após a aprovação."
    />
  );
}
