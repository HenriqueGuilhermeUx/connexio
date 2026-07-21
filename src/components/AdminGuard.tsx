import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useApp } from '@/context/AppContext';
import { PropsWithChildren } from 'react';

export function AdminGuard({ children }: PropsWithChildren) {
  const { dataLoading, isAdmin } = useApp();
  if (dataLoading) return <LoadingState label="Verificando acesso administrativo..." />;
  if (!isAdmin) return <ErrorState title="Acesso restrito" description="Este painel está disponível somente para administradores autorizados." />;
  return <>{children}</>;
}
