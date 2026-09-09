import { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { TravelingBorderGlow } from '@/shared/components/TravelingBorderGlow';

type Props = {
  label:            string;
  value:            string;
  onChangeText:     (v: string) => void;
  placeholder?:     string;
  error?:           string;
  secureTextEntry?: boolean;
  showToggle?:      boolean;
  keyboardType?:    TextInputProps['keyboardType'];
  autoCapitalize?:  TextInputProps['autoCapitalize'];
  autoComplete?:    TextInputProps['autoComplete'];
  // Android only — usar 'no' quando o dropdown de sugestão do Autofill (ex.:
  // contas Google no campo de e-mail) atrapalhar a visibilidade do cursor.
  // Sem valor definido, mantém o comportamento padrão ('auto').
  importantForAutofill?: TextInputProps['importantForAutofill'];
  multiline?:       boolean;
  onBlur?:          () => void;
};

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
  container: {
    flexDirection:      'row',
    alignItems:         'center',
    minHeight:           52,
    borderWidth:         1,
    borderRadius:        radius.md,
    backgroundColor:    'rgba(255,255,255,0.04)',
    paddingHorizontal:   spacing.md,
    gap:                 spacing.sm,
    shadowColor:         colors.brand.primary,
    shadowOffset:        { width: 0, height: 0 },
    shadowRadius:        10,
    elevation:           0,
  },
  containerError: {
    backgroundColor: `${colors.status.error}0F`,
  },
  containerMultiline: {
    alignItems: 'flex-start',
  },
  input: {
    flex:       1,
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
    paddingVertical: spacing.sm,
  },
  inputMultiline: {
    minHeight:          104,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.status.error,
  },
}));

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  showToggle = false,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  importantForAutofill,
  multiline = false,
  onBlur,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const focusProgress = useSharedValue(0);

  const handleFocus = () => {
    focusProgress.value = withTiming(1, { duration: 220 });
    setFocused(true);
  };
  const handleBlur  = () => {
    focusProgress.value = withTiming(0, { duration: 220 });
    setFocused(false);
    onBlur?.();
  };
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [error ? colors.status.error : colors.border.default, colors.border.brand],
    ),
    shadowOpacity: focusProgress.value * 0.5,
  }));

  const isSecure = secureTextEntry && !visible;

  return (
    <View style={s.root}>
      <Text style={s.label}>{label}</Text>

      <Animated.View
        style={[s.container, containerStyle, multiline && s.containerMultiline, error && s.containerError]}
        onLayout={handleLayout}
      >
        {!error && !multiline && (
          <TravelingBorderGlow
            width={size.width}
            height={size.height}
            radius={radius.md}
            color={colors.brand.light}
            active={focused}
          />
        )}

        <TextInput
          // Campos de senha são semi-uncontrolled (defaultValue): o round-trip
          // do `value` controlado a cada tecla faz setText no EditText do
          // Android e cancela o preview nativo do último caractere digitado.
          // O RHF continua sincronizado via onChangeText.
          {...(secureTextEntry ? { defaultValue: value } : { value })}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.muted}
          cursorColor={colors.brand.primary}
          selectionColor={`${colors.brand.primary}66`}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          importantForAutofill={importantForAutofill}
          multiline={multiline}
          style={[s.input, multiline && s.inputMultiline]}
          accessibilityLabel={label}
        />

        {secureTextEntry && showToggle && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? (
              <EyeOff size={20} color={colors.text.secondary} />
            ) : (
              <Eye size={20} color={colors.text.secondary} />
            )}
          </Pressable>
        )}
      </Animated.View>

      {!!error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

