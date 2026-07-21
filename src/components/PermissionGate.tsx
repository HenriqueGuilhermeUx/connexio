import { StatusBanner } from '@/components/StatusBanner';
import { PropsWithChildren } from 'react';

export function PermissionGate({
  allowed,
  title,
  description,
  children,
}: PropsWithChildren<{ allowed: boolean; title: string; description: string }>) {
  if (!allowed) return <StatusBanner tone="warning" title={title} description={description} />;
  return <>{children}</>;
}
