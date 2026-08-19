import { Listing } from '@/types';

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function matchesListing(listing: Listing, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  const haystack = normalizeSearch([
    listing.title,
    listing.description,
    listing.category,
    listing.city,
    listing.region,
    listing.ownerName,
  ].join(' '));
  return haystack.includes(normalized);
}
