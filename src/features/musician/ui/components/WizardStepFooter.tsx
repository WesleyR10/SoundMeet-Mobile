import { Pressable, View, Text, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  error?:      string | null;
  loading?:    boolean;
  disabled?:   boolean;
  onAdvance:   () => void;
  advanceLabel?: string;
  onSkip?:     () => void;
  skipLabel?:  string;
};

// CTA "Avançar" + banner de erro inline (mesmo padrão visual do bannerError da
// RegisterScreen) — comum a todos os steps do wizard. `onSkip` é opcional: só os
// steps 3 (foto) e 4 (PIX) o usam, por serem etapas não-bloqueantes do cadastro.
export function WizardStepFooter({
  error, loading = false, disabled = false, onAdvance,
  advanceLabel = 'Avançar', onSkip, skipLabel = 'Pular por enquanto',
}: Props) {
  return (
    <>
      {!!error && (
        <View style={s.banner}>
          <AlertCircle size={18} color={colors.status.error} strokeWidth={2} />
          <Text style={s.bannerText}>{error}</Text>
        </View>
      )}

      <PrimaryButton label={advanceLabel} onPress={onAdvance} loading={loading} disabled={disabled} style={s.cta} />

      {!!onSkip && (
        <Pressable onPress={onSkip} disabled={loading} style={s.skipBtn} hitSlop={8}>
          <Text style={s.skipText}>{skipLabel}</Text>
        </Pressable>
      )}
    </>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    borderRadius:     radius.md,
    borderWidth:      1,
    borderColor:     `${colors.status.error}59`,
    backgroundColor: `${colors.status.error}14`,
    padding:          spacing.md,
    marginTop:        spacing.lg,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex:  1,
  },
  cta: {
    marginTop: spacing.xl,
  },
  skipBtn: {
    minHeight:      48,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.xs,
  },
  skipText: {
    ...typography.bodySm,
    color:          colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
