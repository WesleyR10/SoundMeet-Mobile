import { Text } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { AvailabilityToggleRow } from '@/shared/components/AvailabilityToggleRow';

type Props = {
  value:    boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

// Seção "Disponibilidade" do accordion de EditProfileScreen — o opt-in de
// radar (open_to_gigs) explícito. Save imediato via useUpdateOpenToGigs (não
// passa pelo RHF/Zod, mesmo padrão de EditWalletSection/EditQRCodeSection).
const useStyles = makeStyles((colors) => ({
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
}));

export function EditAvailabilitySection({ value, onChange, disabled }: Props) {
  const s = useStyles();
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
