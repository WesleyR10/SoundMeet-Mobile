import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';

const SUCCESS_PULSE_MS = 1800;
const SUCCESS_CHECK = require('../../../../../assets/lottie/success-check.json');

type Props = {
  onSave:   () => Promise<boolean>;
  isSaving: boolean;
  error:    string | null;
  label?:   string;
};

// Botão de salvar por seção do accordion (Bloco 2) — cada AccordionSection tem
// o seu, em vez do único "Salvar perfil" que existia antes. Estado de sucesso
// transiente troca o botão por um checkmark Lottie (mesmo idioma de "boolean
// flip dispara feedback one-shot" de QRActionRow/ConfettiBurst, mas usando
// Lottie em vez de ícone estático — animação autoral em assets/lottie/, sem
// dependência externa).
const useStyles = makeStyles((colors) => ({
  btn: {
    height: 48,
  },
  successRow: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:               spacing.sm,
    height:            48,
    borderRadius:      radius.xl,
    backgroundColor:  `${colors.status.success}14`,
    borderWidth:       1,
    borderColor:      `${colors.status.success}40`,
  },
  successAnim: {
    width:  28,
    height: 28,
  },
  successText: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.status.success,
  },
}));

export function AccordionSaveFooter({ onSave, isSaving, error, label = 'Salvar' }: Props) {
  const s = useStyles();
  const [justSaved, setJustSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handlePress = async () => {
    const saved = await onSave();
    if (saved) {
      setJustSaved(true);
      timer.current = setTimeout(() => setJustSaved(false), SUCCESS_PULSE_MS);
    }
  };

  return (
    <>
      {justSaved ? (
        <View style={s.successRow}>
          <LottieView source={SUCCESS_CHECK} autoPlay loop={false} style={s.successAnim} />
          <Text style={s.successText}>Salvo com sucesso</Text>
        </View>
      ) : (
        <PrimaryButton label={label} onPress={handlePress} loading={isSaving} style={s.btn} />
      )}
      {!!error && <ErrorBanner message={error} />}
    </>
  );
}
