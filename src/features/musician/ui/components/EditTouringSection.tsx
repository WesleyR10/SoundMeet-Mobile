import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Plane, CalendarClock } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { EditLocationSection } from './EditLocationSection';
import { MAX_TOURING_DAYS } from '../../domain/musician.types';

// Atalhos de duração em vez de date picker: a pergunta real do músico é "quanto
// tempo eu fico", não "que dia exato eu volto". 30 é o teto do agregado
// (MAX_TOURING_DAYS) e do DTO.
const DURATION_PRESETS = [3, 7, 15, MAX_TOURING_DAYS] as const;

type Props = {
  isActive:        boolean;
  expiresAtLabel:  string | null;
  cep:                  string;
  onChangeCep:          (v: string) => void;
  cepLoading:           boolean;
  cepError?:            string;
  street:               string;
  onChangeStreet:       (v: string) => void;
  number:               string;
  onChangeNumber:       (v: string) => void;
  complement:           string;
  onChangeComplement:   (v: string) => void;
  neighborhood:         string;
  onChangeNeighborhood: (v: string) => void;
  city:                 string;
  onChangeCity:         (v: string) => void;
  state:                string;
  onChangeState:        (v: string) => void;
  stateError?:          string;
  durationDays:      number;
  onChangeDuration:  (days: number) => void;
  onDeactivate:      () => void;
  isDeactivating:    boolean;
};

/**
 * Modo turnê — segundo ponto de busca, temporário (7.13d).
 *
 * ⚠️ **A cópia precisa deixar claro que SOMA, não substitui.** O medo legítimo
 * do músico ao ver "localização temporária" é sumir da própria cidade enquanto
 * viaja — e foi exatamente isso que acontecia antes desta feature existir, quando
 * a única saída era editar o endereço do perfil, sobrescrevendo a base.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  intro: {
    flexDirection: 'row',
    gap:            spacing.sm,
    alignItems:    'flex-start',
  },
  introText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:  1,
  },
  activeCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    borderRadius:     radius.md,
    borderWidth:      1,
    borderColor:     `${colors.brand.primary}40`,
    backgroundColor: colors.brand.muted,
    padding:          spacing.md,
  },
  activeText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex:  1,
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  presets: {
    flexDirection: 'row',
    gap:            spacing.sm,
  },
  preset: {
    flex:            1,
    height:          44,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.default,
    alignItems:      'center',
    justifyContent:  'center',
  },
  presetOn: {
    borderColor:     colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  presetText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  presetTextOn: {
    color:      colors.text.brand,
    fontFamily: 'Inter-SemiBold',
  },
  deactivate: {
    height:          48,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.accent.coral,
    alignItems:      'center',
    justifyContent:  'center',
  },
  deactivateText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.coral,
  },
}));

export function EditTouringSection({
  isActive, expiresAtLabel, durationDays, onChangeDuration, onDeactivate, isDeactivating, ...location
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  return (
    <View style={s.root}>
      <View style={s.intro}>
        <Plane size={16} color={colors.text.muted} />
        <Text style={s.introText}>
          Vai tocar em outra cidade por um tempo? Você aparece na busca de lá{' '}
          <Text style={s.label}>sem sair da busca da sua cidade</Text> — os dois valem ao mesmo tempo,
          e este endereço temporário expira sozinho.
        </Text>
      </View>

      {isActive && (
        <View style={s.activeCard}>
          <CalendarClock size={16} color={colors.brand.primary} />
          <Text style={s.activeText}>
            {expiresAtLabel ? `Modo turnê ativo até ${expiresAtLabel}.` : 'Modo turnê ativo.'}
          </Text>
        </View>
      )}

      <EditLocationSection {...location} />

      <Text style={s.label}>Por quanto tempo?</Text>
      <View style={s.presets}>
        {DURATION_PRESETS.map((days) => {
          const on = durationDays === days;
          return (
            <Pressable
              key={days}
              onPress={() => onChangeDuration(days)}
              style={[s.preset, on && s.presetOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${days} dias`}
            >
              <Text style={[s.presetText, on && s.presetTextOn]}>{days} dias</Text>
            </Pressable>
          );
        })}
      </View>

      {isActive && (
        <Pressable
          onPress={onDeactivate}
          disabled={isDeactivating}
          style={s.deactivate}
          accessibilityRole="button"
          accessibilityLabel="Encerrar modo turnê agora"
        >
          {isDeactivating ? (
            <ActivityIndicator color={colors.accent.coral} />
          ) : (
            <Text style={s.deactivateText}>Encerrar turnê agora</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
