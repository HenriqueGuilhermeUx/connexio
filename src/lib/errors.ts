export function friendlyError(error: unknown, fallback = 'Não foi possível concluir a operação.') {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toLowerCase();

  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (normalized.includes('user already registered')) return 'Já existe uma conta com este e-mail.';
  if (normalized.includes('duplicate key') && normalized.includes('cim')) return 'Este CIM já está vinculado a outro cadastro.';
  if (normalized.includes('row-level security')) return 'Seu acesso ainda não permite esta operação.';
  if (normalized.includes('network') || normalized.includes('fetch')) return 'Confira sua conexão e tente novamente.';
  return raw || fallback;
}
