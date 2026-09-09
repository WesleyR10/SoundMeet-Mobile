import { View, Text } from 'react-native';
import { type Control } from 'react-hook-form';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { EditPriceRangeModelFields } from './EditPriceRangeModelFields';
import type { EditProfileFormValues } from '../../domain/musician.validation';

type Props = {
  control: Control<EditProfileFormValues>;
};

// Faixa de preço com os DOIS modelos de cobrança simultâneos (decisão do
// usuário, jul/2026): o músico pode precificar por hora E por evento, cada
// modelo com min/max/notas independentes — backend guarda uma faixa por
// modelo (MusicianProfile.priceRanges, colunas price_hour_*/price_event_*).
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:             spacing.sm,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          colors.accent.amber,
    textTransform:  'uppercase',
  },
  optional: {
    ...typography.caption,
    color: 'rgba(245,158,11,0.6)',
  },
  helper: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
}));

export function EditPriceRangeSection({ control }: Props) {
  const s = useStyles();
  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.label}>Faixa de preço</Text>
        <Text style={s.optional}>OPCIONAL</Text>
      </View>

      <EditPriceRangeModelFields
        control={control}
        label="Por hora"
        unitSuffix="hora"
        enabledName="priceHourEnabled"
        minName="priceHourMin"
        maxName="priceHourMax"
        notesName="priceHourNotes"
      />

      <EditPriceRangeModelFields
        control={control}
        label="Por evento"
        unitSuffix="evento"
        enabledName="priceEventEnabled"
        minName="priceEventMin"
        maxName="priceEventMax"
        notesName="priceEventNotes"
      />

      <Text style={s.helper}>
        Faixa de cachê exibida aos estabelecimentos como base de negociação —
        “a partir de” é o seu mínimo aceitável e “até” o teto para shows maiores.
      </Text>
    </View>
  );
}
