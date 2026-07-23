import { PriceType } from '@/types';

export function parseBrazilianPrice(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function validateListingForm(input: {
  title: string;
  description: string;
  city: string;
  region: string;
  price: string;
  priceType: PriceType;
}) {
  if (input.title.trim().length < 3) return 'O título precisa ter pelo menos 3 caracteres.';
  if (input.description.trim().length < 10) return 'Explique melhor o que você oferece.';
  if (!input.city.trim()) return 'Informe a cidade de atendimento.';
  if (!input.region.trim()) return 'Informe a região de atendimento.';
  if (input.priceType !== 'ON_REQUEST' && parseBrazilianPrice(input.price) === undefined) {
    return 'Informe um preço válido ou selecione “Sob consulta”.';
  }
  return null;
}
