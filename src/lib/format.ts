import { Listing } from '@/types';

export function listingTypeLabel(type: Listing['type']) {
  if (type === 'BUSINESS') return 'Loja / negócio';
  if (type === 'SERVICE') return 'Serviço';
  return 'Produto';
}

export function listingPriceLabel(listing: Listing) {
  if (listing.priceType === 'ON_REQUEST' || listing.price === undefined) return 'Sob consulta';
  const value = listing.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return listing.priceType === 'FROM' ? `A partir de ${value}` : value;
}

export function listingStatusLabel(status?: Listing['status']) {
  if (status === 'PENDING_MEMBER_APPROVAL') return 'Aguardando validação do membro';
  if (status === 'PENDING_REVIEW') return 'Em revisão';
  if (status === 'PUBLISHED') return 'Publicada';
  if (status === 'PAUSED') return 'Pausada';
  if (status === 'REJECTED') return 'Rejeitada';
  if (status === 'REMOVED') return 'Removida';
  return 'Rascunho';
}
