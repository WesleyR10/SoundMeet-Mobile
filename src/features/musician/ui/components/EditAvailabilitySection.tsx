import { Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { AvailabilityToggleRow } from '@/shared/components/AvailabilityToggleRow';

type Props = {
  value:    boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

// Seção "Disponibilidade" do accordion de EditProfileScreen — o opt-in de
// radar (open_to_gigs) explícito. Save imediato via useUpdateOpenToGigs (não
// passa pelo RHF/Zod, mesmo padrão de EditWalletSection/EditQRCodeSection).
export function EditAvailabilitySection({ value, onChange, disabled }: Props) {
  return (
    <>
      <Text style={s.hint}>
        Só músicos com o radar ligado aparecem na busca de estabelecimentos. Você pode mudar isso quando quiser.
      </Text>
      <AvailabilityToggleRow
        value={value}
        onChange={onChange}
        disabled={disabled}
        title={value ? 'Radar ligado' : 'Radar desligado'}
        subtitle={value ? 'Visível para estabelecimentos' : 'Você não aparece em buscas'}
      />
    </>
  );
}

const s = StyleSheet.create({
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
});
