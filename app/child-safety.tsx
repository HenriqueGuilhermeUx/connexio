import { LegalDocument, LegalSection } from '@/components/LegalDocument';
import { Screen } from '@/components/Screen';

export default function ChildSafetyScreen() {
  return (
    <Screen>
      <LegalDocument
        title="Padrões de Segurança Infantil"
        updatedAt="23 de julho de 2026"
      >
        <LegalSection title="1. Compromisso e tolerância zero">
          O Connexio mantém política de tolerância zero contra abuso e exploração sexual infantil (CSAE) e contra material de abuso sexual infantil (CSAM). É expressamente proibido criar, publicar, enviar, solicitar, armazenar, compartilhar, promover ou facilitar qualquer conteúdo ou comportamento que explore, abuse, sexualize ou coloque crianças e adolescentes em risco.
        </LegalSection>

        <LegalSection title="2. Condutas proibidas">
          São proibidos, entre outros: aliciamento ou preparação de menores para exploração sexual; sextorsão; tráfico ou exploração sexual; solicitação ou troca de imagens íntimas envolvendo menores; tentativa de contato sexual com menores; distribuição de CSAM; incentivo, organização ou facilitação dessas práticas; e qualquer uso do Connexio para colocar crianças ou adolescentes em perigo.
        </LegalSection>

        <LegalSection title="3. Público do aplicativo">
          O Connexio é destinado exclusivamente a pessoas com 18 anos ou mais e a membros verificados da comunidade atendida. A restrição etária não reduz nossa obrigação de prevenir, identificar e responder a qualquer conteúdo ou comportamento relacionado a CSAE ou CSAM.
        </LegalSection>

        <LegalSection title="4. Denúncias e feedback no aplicativo">
          Usuários podem denunciar conteúdos e ofertas pelos mecanismos de denúncia disponíveis no aplicativo. Também podem comunicar preocupações, dúvidas ou suspeitas pelo e-mail de segurança infantil informado abaixo. Denúncias são analisadas pela equipe responsável por segurança e moderação.
        </LegalSection>

        <LegalSection title="5. Medidas de aplicação">
          Ao tomar conhecimento de conteúdo ou comportamento proibido, o Connexio poderá remover imediatamente o material, restringir ou encerrar contas, preservar registros necessários à apuração, impedir novas publicações e adotar outras medidas adequadas conforme estes padrões, os Termos de Uso e a legislação aplicável.
        </LegalSection>

        <LegalSection title="6. Comunicação às autoridades">
          Casos confirmados de CSAM ou de exploração sexual infantil serão tratados conforme a legislação aplicável e poderão ser comunicados às autoridades competentes, incluindo o National Center for Missing & Exploited Children (NCMEC), quando aplicável, e às autoridades regionais ou brasileiras competentes. O Connexio coopera com solicitações legais válidas relacionadas à proteção de crianças e adolescentes.
        </LegalSection>

        <LegalSection title="7. Ponto de contato de segurança infantil">
          O ponto de contato designado para notificações do Google Play, usuários, autoridades e organizações de proteção infantil é a equipe de Segurança Infantil do Connexio. E-mail: henriquecampos66@gmail.com. Assunto recomendado: “Segurança infantil — Connexio”.
        </LegalSection>

        <LegalSection title="8. Atualizações e abrangência">
          Estes padrões se aplicam a todos os usuários, conteúdos, ofertas, imagens, eventos, mensagens de contato e demais recursos do Connexio. Eles poderão ser atualizados para refletir mudanças legais, operacionais ou de segurança, mantendo sempre a proibição expressa de CSAE e CSAM.
        </LegalSection>

        <LegalSection title="9. Responsável">
          Connexio, desenvolvido e operado pela Alternative Ventures, CNPJ 61.920.356/0001-38. Brasil.
        </LegalSection>
      </LegalDocument>
    </Screen>
  );
}
