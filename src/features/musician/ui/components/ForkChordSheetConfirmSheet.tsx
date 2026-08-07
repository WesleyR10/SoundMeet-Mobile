import { useCallback, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';

type Props = {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ForkChordSheetConfirmSheet({ visible, loading, onConfirm, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);
  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
    [],
  );
  return (
    <BottomSheetModal ref={sheetRef} onDismiss={onClose} backdropComponent={backdrop} backgroundStyle={s.bg} handleIndicatorStyle={s.handle} enableDynamicSizing>
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Criar cifra pessoal?</Text>
        <Text style={s.text}>A cifra original da IA não será alterada. Suas correções ficam em uma camada pessoal e podem ser removidas depois.</Text>
        <PrimaryButton label="Criar minha versão" loading={loading} onPress={onConfirm} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  bg: { backgroundColor: colors.bg.elevated, borderRadius: radius.xl },
  handle: { backgroundColor: colors.border.strong },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { ...typography.title, color: colors.text.primary },
  text: { ...typography.body, color: colors.text.secondary },
});
