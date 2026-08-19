import { FormField } from '@/components/FormField';

export function AdminReasonField({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return (
    <FormField
      label="Motivo ou observação (opcional)"
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={500}
      placeholder="Registre uma observação para a trilha de auditoria."
    />
  );
}
