import { Button } from '@/components/Button';
import { openExternalUrl } from '@/components/SafeLink';

export function WebsiteButton({ url }: { url?: string }) {
  if (!url) return null;
  return <Button label="Abrir site" variant="secondary" onPress={() => void openExternalUrl(url)} />;
}
