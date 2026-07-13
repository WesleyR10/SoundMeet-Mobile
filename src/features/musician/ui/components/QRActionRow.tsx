import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { Share2, Download, Check } from 'lucide-react-native';
import { colors, spacing, radius, shadows, typography } from '@/shared/design-system/tokens';

type Props = {
  onShare:    () => void;
  onSave:     () => void;
  isSharing:  boolean;
  isSaving:   boolean;
  justShared: boolean;
  justSaved:  boolean;
};

// Duas ações lado a lado: "Compartilhar" (preenchido, ação mais frequente) e
// "Salvar" (contornado, secundária) — mesmo par primária+secundária do resto
// do app, mas com ícone, o que PrimaryButton não suporta hoje; não vale
// estender um componente compartilhado só por causa destes dois botões.
export function QRActionRow({ onShare, onSave, isSharing, isSaving, justShared, justSaved }: Props) {
  return (
    <>
      <ActionButton
        onPress={onShare}
        loading={isSharing}
        success={justShared}
        disabled={isSharing || isSaving}
        icon={Share2}
        label="Compartilhar"
        successLabel="Enviado!"
        style={[s.btn, s.filled, shadows.brand]}
        pressedStyle={s.filledPressed}
        labelStyle={s.filledLabel}
        iconColor={colors.text.inverse}
        accessibilityLabel="Compartilhar QR Code"
      />

      <ActionButton
        onPress={onSave}
        loading={isSaving}
        success={justSaved}
        disabled={isSharing || isSaving}
        icon={Download}
        label="Salvar"
        successLabel="Salvo!"
        style={[s.btn, s.outlined]}
        pressedStyle={s.outlinedPressed}
        labelStyle={s.outlinedLabel}
        iconColor={colors.brand.primary}
        accessibilityLabel="Salvar QR Code na galeria"
      />
    </>
  );
}

type ActionButtonProps = {
  onPress:      () => void;
  loading:      boolean;
  success:      boolean;
  disabled:     boolean;
  icon:         typeof Share2;
  label:        string;
  successLabel: string;
  style:        StyleProp<ViewStyle>;
  pressedStyle: StyleProp<ViewStyle>;
  labelStyle:   StyleProp<TextStyle>;
  iconColor:    string;
  accessibilityLabel: string;
};

// Pop de escala no instante em que "success" vira true — mesmo idioma de
// "boolean flip dispara animação one-shot" já usado em ConfettiBurst.tsx.
function ActionButton({
  onPress, loading, success, disabled, icon: Icon, label, successLabel,
  style, pressedStyle, labelStyle, iconColor, accessibilityLabel,
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (success) {
      scale.value = withSequence(withSpring(1.08, { damping: 6, stiffness: 200 }), withSpring(1, { damping: 8 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, popStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [style, pressed && !disabled && pressedStyle, disabled && s.disabled]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : success ? (
          <>
            <Check size={20} color={colors.status.success} />
            <Text style={[labelStyle, { color: colors.status.success }]}>{successLabel}</Text>
          </>
        ) : (
          <>
            <Icon size={20} color={iconColor} />
            <Text style={labelStyle}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    height:         56,
    borderRadius:   radius.xl,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.sm,
  },
  filled: {
    backgroundColor: colors.brand.primary,
  },
  filledPressed: {
    backgroundColor: colors.brand.dark,
    transform:       [{ scale: 0.98 }],
  },
  filledLabel: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.inverse,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: colors.border.brand,
  },
  outlinedPressed: {
    backgroundColor: colors.brand.muted,
    transform:       [{ scale: 0.98 }],
  },
  outlinedLabel: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.brand.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
