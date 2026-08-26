import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AudioLines, Clock, TriangleAlert } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import type { PracticeJobStatus } from '../../domain/practice.types';

type Props = {
  status:      PracticeJobStatus | 'idle';
  progress:    number;
  stage:       string | null;
  errorMessage: string | null;
  isRequesting: boolean;
  onStart:     () => void;
};

/**
 * O estado ANTES de existir áudio para tocar — e ele é a maior parte da vida
 * desta tela.
 *
 * A separação roda em GPU e demora. Uma tela em branco com spinner faria o
 * músico achar que travou e sair; por isso o estágio do worker é exibido em
 * texto e o tempo esperado é dito na cara, sem eufemismo.
 */
export function PracticePrepareCard({
  status,
  progress,
  stage,
  errorMessage,
  isRequesting,
  onStart,
}: Props) {
  if (status === 'queued' || status === 'processing' || isRequesting) {
    return (
      <View style={s.card}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
        <Text style={s.title}>Separando os instrumentos</Text>
        <Text style={s.text}>
          A IA está isolando voz, bateria, baixo e harmonia. Costuma levar alguns
          minutos — dá para sair da tela e voltar.
        </Text>

        <View style={s.track}>
          <View style={[s.trackFill, { width: `${Math.max(4, progress)}%` }]} />
        </View>
        <Text style={s.stage}>
          {progress}%{stage ? ` · ${stage}` : ''}
        </Text>
      </View>
    );
  }

  if (status === 'expired') {
    return (
      <View style={s.card}>
        <Clock size={40} color={colors.accent.amber} />
        <Text style={s.title}>Este ensaio expirou</Text>
        {/* Honesto sobre o motivo: não deu erro, o prazo venceu. Guardar a
            gravação separada por tempo indeterminado é justamente o que o
            sistema não faz. */}
        <Text style={s.text}>
          As faixas separadas ficam guardadas por pouco tempo e já foram
          apagadas. Separar de novo leva os mesmos minutos.
        </Text>
        <PrimaryButton label="Separar de novo" onPress={onStart} style={s.cta} />
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={s.card}>
        <TriangleAlert size={40} color={colors.status.error} />
        <Text style={s.title}>Não deu para separar</Text>
        <Text style={s.text}>
          {errorMessage ?? 'A fonte do áudio não respondeu. Tente de novo em instantes.'}
        </Text>
        <PrimaryButton label="Tentar de novo" onPress={onStart} style={s.cta} />
      </View>
    );
  }

  return (
    <View style={s.card}>
      <AudioLines size={40} color={colors.brand.primary} />
      <Text style={s.title}>Modo Ensaio</Text>
      <Text style={s.text}>
        Separe a música em voz, bateria, baixo e harmonia, tire o seu instrumento
        e toque por cima — com a cifra rolando no tempo da gravação.
      </Text>
      <PrimaryButton
        label="Separar instrumentos"
        onPress={onStart}
        style={s.cta}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    alignItems:      'center',
    gap:              spacing.md,
    padding:          spacing.xl,
    borderRadius:     radius.xl,
    borderWidth:      1,
    borderColor:      colors.border.default,
    backgroundColor:  colors.bg.elevated,
  },
  title: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  track: {
    alignSelf:       'stretch',
    height:          6,
    borderRadius:    radius.full,
    backgroundColor: colors.border.default,
    overflow:       'hidden',
  },
  trackFill: {
    height:          '100%',
    borderRadius:    radius.full,
    backgroundColor: colors.brand.primary,
  },
  stage: {
    ...typography.caption,
    color: colors.text.muted,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
