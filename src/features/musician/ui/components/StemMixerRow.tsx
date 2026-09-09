import { View, Text, Pressable } from 'react-native';
import { Headphones, Volume2, VolumeX } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { stemLabel } from '../../domain/practice.types';
import type { StemTrack } from '../../application/usePracticeStems';

type Props = {
  track:       StemTrack;
  isSoloed:    boolean;
  isSilenced:  boolean;
  onToggleMute: () => void;
  onToggleSolo: () => void;
};

/**
 * Uma faixa da mesa.
 *
 * **Mute e solo, sem fader contínuo.** O caso de uso é binário — "tira o meu
 * instrumento" ou "deixa só ele" — e um slider exigiria construir o controle do
 * zero com gesture-handler (não há lib de slider no projeto) para um ganho que
 * ninguém pediu. Mesmo motivo pelo qual o Play Mode usa stepper de velocidade
 * em vez de slider.
 */
const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    paddingVertical:  spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:     radius.lg,
    borderWidth:      1,
    borderColor:      colors.border.default,
    backgroundColor:  colors.bg.elevated,
  },
  rowSilenced: {
    opacity: 0.55,
  },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:       1,
  },
  nameSilenced: {
    color: colors.text.secondary,
  },
  // 48×48 é o mínimo de toque exigido pelo projeto — e aqui em especial: a mão
  // que opera isto está segurando um instrumento.
  btn: {
    width:           48,
    height:          48,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.default,
  },
  btnActiveMute: {
    borderColor:     colors.accent.coral,
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
  btnActiveSolo: {
    borderColor:     colors.brand.primary,
    backgroundColor: colors.brand.primary,
  },
}));

export function StemMixerRow({
  track,
  isSoloed,
  isSilenced,
  onToggleMute,
  onToggleSolo,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const label = stemLabel(track.name);

  return (
    <View style={[s.row, isSilenced && s.rowSilenced]}>
      <Text style={[s.name, isSilenced && s.nameSilenced]} numberOfLines={1}>
        {label}
      </Text>

      <Pressable
        onPress={onToggleMute}
        style={[s.btn, track.muted && s.btnActiveMute]}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: track.muted }}
        accessibilityLabel={`${track.muted ? 'Religar' : 'Silenciar'} ${label}`}
      >
        {track.muted ? (
          <VolumeX size={18} color={colors.accent.coral} />
        ) : (
          <Volume2 size={18} color={colors.text.secondary} />
        )}
      </Pressable>

      <Pressable
        onPress={onToggleSolo}
        style={[s.btn, isSoloed && s.btnActiveSolo]}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: isSoloed }}
        accessibilityLabel={`${isSoloed ? 'Desfazer solo de' : 'Ouvir só'} ${label}`}
      >
        <Headphones
          size={18}
          color={isSoloed ? colors.text.inverse : colors.text.secondary}
        />
      </Pressable>
    </View>
  );
}
