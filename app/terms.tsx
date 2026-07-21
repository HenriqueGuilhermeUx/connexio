import { LegalDocument, LegalSection } from '@/components/LegalDocument';
import { Screen } from '@/components/Screen';

export default function TermsScreen() {
  return (
    <Screen>
      <LegalDocument title="Termos de Uso" updatedAt="21 de julho de 2026">
        <LegalSection title="1. Objeto">
          O Connexio é uma rede privada para descoberta de negócios, produtos e serviços apresentados por usuários cuja identificação é submetida a validação. A plataforma não é instituição financeira, intermediadora de pagamentos nem parte das negociações realizadas entre usuários.
        </LegalSection>
        <LegalSection title="2. Cadastro e validação">
          O usuário deve fornecer informações verdadeiras e manter sua conta segura. O acesso a contatos, a identificação como membro verificado e a publicação pública dependem de aprovação administrativa. A aprovação pode ser recusada ou suspensa quando houver inconsistência, risco ou violação destes Termos.
        </LegalSection>
        <LegalSection title="3. Ofertas e responsabilidade">
          Cada ofertante é responsável pela veracidade, legalidade, qualidade, preço, entrega, garantia, tributos, licenças e atendimento relacionados ao que publica. O Connexio pode revisar, ocultar, rejeitar ou remover conteúdo para proteger a comunidade e cumprir a lei.
        </LegalSection>
        <LegalSection title="4. Condutas proibidas">
          É proibido publicar conteúdo ilícito, enganoso, discriminatório, ofensivo, fraudulento, invasivo de privacidade, que viole propriedade intelectual ou que ofereça itens e serviços proibidos pela legislação. Também é proibido contornar validações, coletar dados em massa ou comprometer a segurança da plataforma.
        </LegalSection>
        <LegalSection title="5. Contatos e negociações">
          Contatos e negociações acontecem diretamente entre os usuários. Antes de contratar, cada parte deve realizar as verificações profissionais e comerciais que considerar necessárias. A confiança da rede não substitui diligência, contrato ou documentação adequada.
        </LegalSection>
        <LegalSection title="6. Denúncia e moderação">
          Usuários podem denunciar ofertas. A administração analisará o conteúdo e poderá advertir, restringir, suspender ou excluir contas e publicações. Registros de moderação podem ser conservados para segurança, auditoria e prevenção de abuso.
        </LegalSection>
        <LegalSection title="7. Disponibilidade">
          A plataforma é fornecida em evolução contínua. Podem ocorrer indisponibilidades, mudanças e correções. Não garantimos resultado comercial, volume de contatos ou continuidade de uma funcionalidade específica.
        </LegalSection>
        <LegalSection title="8. Encerramento e legislação">
          O usuário pode solicitar exclusão da conta pelos caminhos disponibilizados. Estes Termos são regidos pela legislação brasileira. Questões não resolvidas pelos canais de suporte serão submetidas ao foro competente conforme as regras legais aplicáveis.
        </LegalSection>
      </LegalDocument>
    </Screen>
  );
}
