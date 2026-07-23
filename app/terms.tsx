import { LegalDocument, LegalSection } from '@/components/LegalDocument';
import { Screen } from '@/components/Screen';

export default function TermsScreen() {
  return (
    <Screen>
      <LegalDocument title="Termos de Uso" updatedAt="22 de julho de 2026">
        <LegalSection title="1. Objeto">
          O Connexio é uma rede privada para descoberta de negócios, produtos, serviços e eventos apresentados por usuários cuja identificação é submetida a validação. A plataforma não é instituição financeira, intermediadora de pagamentos, organizadora dos eventos divulgados nem parte das negociações realizadas entre usuários.
        </LegalSection>
        <LegalSection title="2. Cadastro e validação">
          O usuário deve fornecer informações verdadeiras, incluindo seus dados maçônicos, e manter sua conta segura. O acesso a contatos, a identificação como membro verificado e a publicação pública dependem de aprovação administrativa. A aprovação pode ser recusada ou suspensa quando houver inconsistência, risco ou violação destes Termos.
        </LegalSection>
        <LegalSection title="3. Ofertas e responsabilidade">
          Cada ofertante é responsável pela veracidade, legalidade, qualidade, preço, entrega, garantia, tributos, licenças e atendimento relacionados ao que publica. O Connexio pode revisar, ocultar, rejeitar ou remover conteúdo para proteger a comunidade e cumprir a lei.
        </LegalSection>
        <LegalSection title="4. Eventos">
          O responsável por um evento deve informar data real, horário, local, cidade, organizador, contato e demais condições com precisão. Inscrições, ingressos, pagamentos, segurança, autorizações, alimentação, estrutura, cancelamento e execução do evento são de responsabilidade dos realizadores. O Connexio pode aprovar, destacar, rejeitar, cancelar ou remover a divulgação.
        </LegalSection>
        <LegalSection title="5. Comunicações regionais">
          Eventos aprovados podem ser enviados por e-mail somente a usuários que autorizaram esse recebimento. A seleção considera cidade, estado e alcance da divulgação. O usuário pode desativar essa preferência no perfil. O organizador não recebe a lista de destinatários nem pode usar o Connexio para obter e-mails em massa.
        </LegalSection>
        <LegalSection title="6. Condutas proibidas">
          É proibido publicar conteúdo ilícito, enganoso, discriminatório, ofensivo, fraudulento, invasivo de privacidade, que viole propriedade intelectual ou que ofereça itens e serviços proibidos pela legislação. Também é proibido contornar validações, coletar dados em massa, divulgar eventos inexistentes ou comprometer a segurança da plataforma.
        </LegalSection>
        <LegalSection title="7. Contatos e negociações">
          Contatos e negociações acontecem diretamente entre os usuários. O botão de WhatsApp pode preencher uma mensagem de apresentação com nome e Loja Maçônica do interessado; o envio só acontece quando o próprio usuário confirma no WhatsApp. Antes de contratar ou participar de evento, cada parte deve realizar as verificações que considerar necessárias.
        </LegalSection>
        <LegalSection title="8. Denúncia, bloqueio e moderação">
          Usuários podem denunciar ofertas e bloquear anunciantes. A administração analisará conteúdos e poderá advertir, restringir, suspender ou excluir contas, ofertas e eventos. Registros de moderação podem ser conservados para segurança, auditoria e prevenção de abuso.
        </LegalSection>
        <LegalSection title="9. Disponibilidade">
          A plataforma é fornecida em evolução contínua. Podem ocorrer indisponibilidades, mudanças e correções. Não garantimos resultado comercial, volume de contatos, comparecimento a eventos ou continuidade de uma funcionalidade específica.
        </LegalSection>
        <LegalSection title="10. Encerramento e legislação">
          O usuário pode solicitar exclusão da conta pelos caminhos disponibilizados. Estes Termos são regidos pela legislação brasileira. Questões não resolvidas pelos canais de suporte serão submetidas ao foro competente conforme as regras legais aplicáveis.
        </LegalSection>
      </LegalDocument>
    </Screen>
  );
}
