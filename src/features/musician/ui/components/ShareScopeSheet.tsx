import { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Lock, Users, Globe2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import type { ShareScope } from '../../domain/personal-chord-sheet.types';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSheetModalVisibility } from '@/shared/hooks/useSheetModalVisibility';
import type { ThemeColors } from '@/shared/services/ThemeContext';

type Props = {
  visible:        boolean;
  currentScope:   ShareScope;
  loading?:       boolean;
  error?:         string | null;
  onSelect:       (scope: ShareScope) => void;
  onPressUpgrade: () => void;
  onClose:        () => void;
};

const OPTIONS = (colors: ThemeColors): { value: ShareScope; label: string; hint: string; icon: typeof Lock; accent: string }[] => ([
  { value: 'private',   label: 'Privada',   hint: 'Só você vê essa cifra pessoal.',                          icon: Lock,   accent: colors.text.secondary },
  { value: 'band',      label: 'Banda',     hint: 'Todos os membros aceitos da sua banda podem ver.',        icon: Users,  accent: colors.brand.primary },
  { value: 'community',  label: 'Comunidade', hint: 'Qualquer músico da plataforma pode ver e importar.',    icon: Globe2, accent: colors.accent.violet },
]);

// 3 pills private/band/community — mesmo idioma visual de
// EditRepertoireShareSection.tsx, mas com 3 estados em vez de on/off.
// "Comunidade" usa o acento violeta (momentos premium, ver tokens.ts) porque
// é a única opção gated por plano (ESSENCIAL/PRO); banda é liberada em
// todos os tiers.
export function ShareScopeSheet({ visible, currentScope, loading, error, onSelect, onPressUpgrade, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { sheetRef, trackDismiss } = useSheetModalVisibility(visible);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={trackDismiss(onClose)}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Compartilhamento</Text>

        {OPTIONS(colors).map((opt) => {
          const active = currentScope === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              disabled={loading}
              style={[s.option, active && { borderColor: opt.accent, backgroundColor: `${opt.accent}14` }]}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: active, disabled: loading }}
            >
              <opt.icon size={20} color={opt.accent} />
              <View style={s.optionText}>
                <Text style={[s.optionLabel, active && { color: opt.accent }]}>{opt.label}</Text>
                <Text style={s.optionHint}>{opt.hint}</Text>
              </View>
            </Pressable>
          );
        })}

        {!!error && (
          <View style={s.errorWrap}>
            <ErrorBanner message={error} />
            <Pressable onPress={onPressUpgrade} accessibilityRole="button" accessibilityLabel="Ver planos">
              <Text style={s.upgradeLink}>Ver planos</Text>
            </Pressable>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const useStyles = makeStyles((colors) => ({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.xxl,
    gap:                 spacing.sm,
  },
  title: {
    ...typography.title,
    color:        colors.text.primary,
    marginBottom:  spacing.sm,
  },
  option: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             spacing.md,
    borderRadius:    radius.lg,
    borderWidth:      1,
    borderColor:     colors.border.default,
    padding:          spacing.md,
  },
  optionText: {
    flex: 1,
    gap:   2,
  },
  optionLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  optionHint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  errorWrap: {
    gap: spacing.xs,
  },
  upgradeLink: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
    textAlign: 'center',
  },
}));
