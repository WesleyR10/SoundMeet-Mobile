import { useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { RadarPulseIndicator } from '@/shared/components/RadarPulseIndicator';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useUpdateOpenToGigs, getUpdateOpenToGigsErrorMessage } from '../../application/useUpdateOpenToGigs';

type Props = {
  visible:    boolean;
  onClose:    () => void;
  musicianId: string | null;
};

// Momento de decisão pró-ativo do opt-in de radar (jul/2026) — open_to_gigs
// nunca nasce true, então todo músico existente fica invisível na busca até
// decidir. Disparado pela HomeScreen quando musician.open_to_gigs === null,
// uma vez por sessão. "Decidir depois" só fecha o sheet (o valor continua
// null, reaparece no próximo cold start) — nunca força a decisão.
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
    gap:                 spacing.md,
    alignItems:         'center',
  },
  hero: {
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color:      colors.text.primary,
    textAlign:  'center',
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  btnSpacing: {
    width:      '100%',
    marginTop:  spacing.sm,
  },
  declineBtn: {
    width:             '100%',
    height:            48,
    borderRadius:      radius.xl,
    borderWidth:        1,
    borderColor:       colors.border.strong,
    alignItems:        'center',
    justifyContent:    'center',
  },
  declineLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  laterLabel: {
    ...typography.bodySm,
    color:        colors.text.muted,
    textDecorationLine: 'underline',
    marginTop:     spacing.xs,
  },
}));

export function OpenToGigsDecisionSheet({ visible, onClose, musicianId }: Props) {
  const s = useStyles();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [error, setError] = useState<string | null>(null);
  const updateOpenToGigs = useUpdateOpenToGigs(musicianId);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="none" />
    ),
    [],
  );

  const decide = async (value: boolean) => {
    setError(null);
    try {
      await updateOpenToGigs.mutateAsync(value);
      onClose();
    } catch (err) {
      setError(getUpdateOpenToGigsErrorMessage(err));
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <View style={s.hero}>
          <RadarPulseIndicator active size={96} />
        </View>

        <Text style={s.title}>Quer aparecer pra estabelecimentos?</Text>
        <Text style={s.subtitle}>
          Ligue o radar e estabelecimentos que buscam músico pra tocar vão te encontrar. Você pode mudar isso quando quiser em Editar Perfil.
        </Text>

        {!!error && <ErrorBanner message={error} />}

        <PrimaryButton
          label="Sim, quero aparecer"
          onPress={() => decide(true)}
          loading={updateOpenToGigs.isPending}
          style={s.btnSpacing}
        />
        <Pressable
          onPress={() => decide(false)}
          disabled={updateOpenToGigs.isPending}
          style={s.declineBtn}
          accessibilityRole="button"
          accessibilityLabel="Prefiro não aparecer por enquanto"
        >
          <Text style={s.declineLabel}>Prefiro não aparecer por enquanto</Text>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Decidir depois" hitSlop={8}>
          <Text style={s.laterLabel}>Decidir depois</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
