import { LegalDocument, LegalSection } from '@/components/LegalDocument';
import { Screen } from '@/components/Screen';
import { CONNEXIO } from '@/lib/constants';

export default function PrivacyScreen() {
  return (
    <Screen>
      <LegalDocument title="Política de Privacidade" updatedAt="22 de julho de 2026">
        <LegalSection title="1. Responsável">
          O Connexio é desenvolvido e operado pela Alternative Ventures, CNPJ 61.920.356/0001-38. Dúvidas sobre privacidade podem ser enviadas para henriquecampos66@gmail.com.
        </LegalSection>
        <LegalSection title="2. Dados tratados">
          Para criar e validar a conta, tratamos nome, e-mail, telefone/WhatsApp, CIM e dados de autenticação. O CIM permanece em área restrita. Também tratamos Loja Maçônica, número da Loja, potência ou obediência, cidade, estado, ofertas, imagens, eventos, favoritos, bloqueios, denúncias e registros necessários à segurança e moderação.
        </LegalSection>
        <LegalSection title="3. Finalidades">
          Usamos os dados para autenticar o usuário, validar o vínculo informado, operar a rede privada, identificar o membro em contatos comerciais iniciados por ele, publicar e pesquisar ofertas, divulgar eventos aprovados, mostrar conteúdo regional, permitir contatos entre membros aprovados, prevenir abusos, atender solicitações e cumprir obrigações legais.
        </LegalSection>
        <LegalSection title="4. Eventos e comunicações por e-mail">
          O usuário pode autorizar o recebimento de eventos aprovados por e-mail. Cidade e estado são usados para selecionar comunicações compatíveis com o alcance definido pelo organizador. Essa autorização é opcional e pode ser desativada a qualquer momento na área de perfil. O Connexio registra tentativas de envio para controle operacional e prevenção de mensagens duplicadas.
        </LegalSection>
        <LegalSection title="5. Compartilhamento e infraestrutura">
          Dados são processados por fornecedores de infraestrutura necessários à operação, incluindo Supabase, serviços de hospedagem e o provedor de e-mail Resend. Esses fornecedores atuam para prestar os serviços contratados. O Connexio não vende dados pessoais a anunciantes. Contatos de ofertantes somente são exibidos a membros aprovados e conforme as regras do produto.
        </LegalSection>
        <LegalSection title="6. Segurança e acesso">
          Utilizamos autenticação, políticas de acesso no banco de dados, armazenamento privado de imagens, URLs temporárias e separação de dados sensíveis. Bloqueios pessoais ocultam ofertas e contatos do anunciante para quem realizou o bloqueio. Nenhum sistema é infalível; incidentes relevantes serão tratados conforme a legislação aplicável.
        </LegalSection>
        <LegalSection title="7. Conservação e exclusão">
          Os dados permanecem enquanto a conta estiver ativa ou enquanto forem necessários à operação e a obrigações legítimas. O usuário pode iniciar a exclusão no Perfil ou pela página pública de exclusão. A exclusão remove conta e dados associados, ressalvadas retenções estritamente necessárias por segurança, prevenção de fraude ou obrigação legal, quando aplicável.
        </LegalSection>
        <LegalSection title="8. Direitos do titular">
          O titular pode solicitar confirmação, acesso, correção, portabilidade quando aplicável, informação, oposição e exclusão, observados os limites legais. Solicitações podem ser enviadas ao e-mail de suporte. Preferências de eventos por e-mail podem ser alteradas diretamente no aplicativo.
        </LegalSection>
        <LegalSection title="9. Atualizações">
          Esta política pode ser atualizada para refletir mudanças legais ou operacionais. Alterações relevantes serão comunicadas no aplicativo e poderão exigir novo aceite.
        </LegalSection>
      </LegalDocument>
    </Screen>
  );
}

export const privacyMetadata = {
  developer: CONNEXIO.company,
  version: CONNEXIO.privacyVersion,
};
