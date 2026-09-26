import { Text } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { AvailabilityToggleRow } from '@/shared/components/AvailabilityToggleRow';

type Props = {
  value:    boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

// Seção "Pedidos de música" do accordion de EditProfileScreen — o escopo do
// que o público pode pedir. Save imediato via useUpdateRequestScope (não passa
// pelo RHF/Zod, mesmo padrão de EditAvailabilitySection).
const useStyles = makeStyles((colors) => ({
  hint: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  consequence: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
}));

/**
 * Ligado (padrão): o fã busca no catálogo da plataforma e pode pedir qualquer
 * música — e o músico recusa o que não toca. Desligado: só o repertório dele.
 *
 * 🔴 O texto diz que desligar **impede** o pedido, e não que apenas "esconde"
 * as outras músicas, porque é isso que acontece: o servidor recusa. Prometer
 * menos do que a regra faz deixaria o músico achando que ainda vai receber
 * pedidos de fora e que só a busca mudou.
 */
export function EditRequestScopeSection({ value, onChange, disabled }: Props) {
  const s = useStyles();
  return (
    <>
      <Text style={s.hint}>
        Com pedidos abertos, o público busca no catálogo do SoundMeet e pode pedir qualquer música —
        você aceita ou recusa cada uma.
      </Text>
      <AvailabilityToggleRow
        value={value}
        onChange={onChange}
        disabled={disabled}
        title={value ? 'Pedidos abertos' : 'Só o meu repertório'}
        subtitle={
          value
            ? 'O público pode pedir qualquer música'
            : 'O público só escolhe entre as suas músicas'
        }
      />
      <Text style={s.consequence}>
        {value
          ? 'Se o público pedir algo que você não toca, é só recusar.'
          : 'Pedidos fora do seu repertório são recusados automaticamente, e o público vê um aviso explicando isso.'}
      </Text>
    </>
  );
}
