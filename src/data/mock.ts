import { Listing, Lodge, Membership, Member } from '@/types';

// Dados exclusivamente para desenvolvimento local sem Supabase.
// Produção nunca deve exibir empresas/ofertas fictícias.
export const demoMember: Member = {
  id: 'member-demo',
  name: 'Membro de Demonstração',
  email: 'demo@connexio.local',
  whatsapp: '',
  city: '',
  region: '',
  lodge: 'Loja de Demonstração',
  cimMasked: '••••',
  status: 'APPROVED',
};

export const demoLodge: Lodge = {
  id: 'lodge-demo',
  name: 'Loja de Demonstração',
  orient: '',
  region: '',
  plan: 'FREE',
  verified: false,
};

export const demoMembership: Membership = {
  id: 'membership-demo',
  memberId: demoMember.id,
  lodgeId: demoLodge.id,
  role: 'WORSHIPFUL_MASTER',
  status: 'ACTIVE',
};

export const categories = [
  'Todos',
  'Advocacia',
  'Contabilidade',
  'Engenharia',
  'Imóveis',
  'Saúde',
  'Tecnologia',
  'Automotivo',
  'Alimentação',
  'Turismo',
];

// Nunca semear ofertas fictícias no app. Em produção a vitrine deve vir do Supabase.
export const initialListings: Listing[] = [];
