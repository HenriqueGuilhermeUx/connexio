import { Button } from '@/components/Button';
import { DeveloperCredit } from '@/components/DeveloperCredit';
import { OwnOffersSection } from '@/components/OwnOffersSection';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileInfoCard } from '@/components/ProfileInfoCard';
import { ProfileStats } from '@/components/ProfileStats';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { VerificationNotice } from '@/components/VerificationNotice';
import { useApp } from '@/context/AppContext';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const { member, listings, isAdmin, blockedMembers, logout } = useApp();

  if (!member) return null;

  const ownListings = listings.filter((listing) => listing.ownerId === member.id);
  const lodgeLabel = member.lodgeNumber ? `${member.lodge} nº ${member.lodgeNumber}` : member.lodge;

  const leave = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <Screen contentStyle={styles.content}>
      <ProfileHeader member={member} />
      <ProfileStats offers={ownListings.length} city={member.city} />
      <VerificationNotice status={member.status} />
      <ProfileInfoCard rows={[
        { icon: 'mail', label: 'E-mail', value: member.email },
        { icon: 'phone', label: 'WhatsApp', value: member.whatsapp },
        { icon: 'shield', label: 'CIM', value: member.cimMasked },
        { icon: 'home', label: 'Loja', value: lodgeLabel },
        { icon: 'map-pin', label: 'Oriente / Região', value: [member.city, member.region].filter(Boolean).join(' · ') || 'Ainda não informada' },
      ]} />
      <Button label="Editar dados maçônicos e eventos" variant="secondary" onPress={() => router.push('/edit-profile')} />
      <OwnOffersSection listings={ownListings} />

      <View style={styles.section}>
        <SectionHeader title="Agenda Connexio" subtitle="Consulte e divulgue eventos da irmandade." />
        <Button label="Ver eventos da minha região" variant="secondary" onPress={() => router.push('/events')} />
        {member.status === 'APPROVED' ? <Button label="Divulgar um evento" variant="secondary" onPress={() => router.push('/create-event')} /> : null}
      </View>

      {isAdmin ? (
        <View style={styles.section}>
          <SectionHeader title="Administração" subtitle="Validação, moderação e publicação." />
          <Button label="Abrir painel administrativo" variant="secondary" onPress={() => router.push('/admin')} />
          <Button label="Aprovar eventos" variant="secondary" onPress={() => router.push('/admin-events')} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Segurança e privacidade" subtitle="Controle sua senha, seus dados e sua conta." />
        <Button
          label={`Anunciantes bloqueados (${blockedMembers.length})`}
          variant="secondary"
          onPress={() => router.push('/blocked-members')}
        />
        <Button label="Recuperar ou trocar senha" variant="secondary" onPress={() => router.push('/forgot-password')} />
        <Button label="Política de Privacidade" variant="secondary" onPress={() => router.push('/privacy')} />
        <Button label="Termos de Uso" variant="secondary" onPress={() => router.push('/terms')} />
        <Button label="Excluir minha conta" variant="danger" onPress={() => router.push('/delete-account')} />
      </View>

      <Button label="Sair da conta" variant="ghost" onPress={() => void leave()} />
      <DeveloperCredit />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 22, gap: 25 },
  section: { gap: 11 },
});
