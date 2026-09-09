import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import type { CifraSearchResult, AiCifraAnalysisJob } from '../../domain/cifra-search.types';

type Props = {
  result:          CifraSearchResult;
  job:             AiCifraAnalysisJob | undefined;
  flowError:       string | null;
  isAdding:        boolean;
  onAddToRepertoire: () => void;
  onRetry:         () => void;
};

// Extraído de CifraSearchScreen.tsx (limite ~200 linhas/arquivo).
const useStyles = makeStyles((colors) => ({
  card: {
    marginHorizontal: spacing.xl,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.default,
    backgroundColor: colors.bg.surface,
    padding:          spacing.lg,
    gap:               spacing.sm,
    ...shadows.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    marginTop:      spacing.sm,
  },
  statusText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:   1,
  },
  banner: {
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.md,
  },
}));

export function CifraAnalysisProgressCard({ result, job, flowError, isAdding, onAddToRepertoire, onRetry }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const status = job?.status ?? 'queued';

  return (
    <View style={s.card}>
      <Text style={s.title} numberOfLines={1}>{result.title}</Text>
      <Text style={s.artist} numberOfLines={1}>{result.artist}</Text>

      {status === 'failed' ? (
        <View style={s.statusRow}>
          <XCircle size={18} color={colors.status.error} />
          <Text style={s.statusText}>Falha ao gerar a cifra: {job?.error_message ?? 'tente outra música'}</Text>
        </View>
      ) : status === 'completed' ? (
        <View style={s.statusRow}>
          <CheckCircle2 size={18} color={colors.brand.primary} />
          <Text style={s.statusText}>Cifra pronta</Text>
        </View>
      ) : (
        <View style={s.statusRow}>
          <ActivityIndicator color={colors.brand.primary} size="small" />
          <Text style={s.statusText}>{job?.progress_stage ?? 'Analisando'}… {job?.progress_percent ?? 0}%</Text>
        </View>
      )}

      {!!flowError && <ErrorBanner message={flowError} style={s.banner} />}

      <View style={s.actions}>
        {status === 'failed' ? (
          <PrimaryButton label="Tentar outra música" onPress={onRetry} variant="coral" />
        ) : (
          <PrimaryButton
            label="Adicionar ao repertório"
            onPress={onAddToRepertoire}
            disabled={status !== 'completed'}
            loading={isAdding}
          />
        )}
      </View>
    </View>
  );
}
