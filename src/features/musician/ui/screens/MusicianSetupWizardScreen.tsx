import { useEffect } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing } from '@/shared/design-system/tokens';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusicianWizardGate } from '../../application/useMusicianWizardGate';
import { useMusicianWizardState } from './useMusicianWizardState';
import { useMusicianWizardHandlers } from './useMusicianWizardHandlers';
import { WizardBackground } from '../components/WizardBackground';
import { WizardProgress } from '../components/WizardProgress';
import { WizardStepFooter } from '../components/WizardStepFooter';
import { StepOneIdentity } from '../components/StepOneIdentity';
import { StepTwoTags } from '../components/StepTwoTags';
import { StepThreePhoto } from '../components/StepThreePhoto';
import { StepFourPix } from '../components/StepFourPix';
import { StepFiveQrReveal } from '../components/StepFiveQrReveal';

// Único screen com estado interno de step (não 5 entradas de stack) — o background
// teal→violeta e o WizardProgress precisam de continuidade visual entre steps, que
// um push/pop de navigation destruiria. Back de hardware é sempre bloqueado: a
// única saída controlada do Step 2 é a seta "Voltar" em tela; do Step 3 em diante a
// conta já foi persistida, então não existe "voltar". Handlers assíncronos vivem em
// useMusicianWizardHandlers.ts (limite de ~200 linhas por screen — CLAUDE.md).
export function MusicianSetupWizardScreen() {
  const authUser = useAuthStore((s) => s.user);
  const musicianId = authUser?.musicianId ?? null;
  const queryClient = useQueryClient();
  // Mesma query (dedupada pelo TanStack Query) já resolvida pelo RootNavigator
  // antes de montar este screen — só para saber em que step retomar (1.20: se
  // stage_name já existe mas o wizard nunca chegou no Step 5, retoma no Step 3
  // em vez de reiniciar do zero).
  const gate = useMusicianWizardGate();
  const resumeStep = gate.kind === 'needs-wizard' ? gate.resumeStep : 1;
  const wizard = useMusicianWizardState(resumeStep);
  const {
    step2Valid, isUpdatingMusician, isUploadingAvatar, isSavingPixKey,
    handleAdvanceStep1, handleAdvanceStep2, handleUploadAvatar, handleSavePix, handleGoHome,
  } = useMusicianWizardHandlers(wizard, musicianId, queryClient);

  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const contentY       = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((wizard.state.step - 1) / 4, { duration: 600 });
    contentOpacity.value = 0;
    contentY.value       = 16;
    contentOpacity.value = withTiming(1, { duration: 280 });
    contentY.value       = withTiming(0, { duration: 280 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.state.step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <WizardBackground progress={progress} step={wizard.state.step} />

      <View style={s.progressWrap}>
        <WizardProgress step={wizard.state.step} />
      </View>

      {wizard.state.step === 2 && (
        <Pressable
          onPress={wizard.goBackToStep1}
          style={s.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar para nome artístico"
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={contentStyle}>
            {wizard.state.step === 1 && (
              <StepOneIdentity
                stageName={wizard.state.stageName}
                bio={wizard.state.bio}
                errors={wizard.state.fieldErrors}
                onChangeStageName={wizard.setStageName}
                onChangeBio={wizard.setBio}
              />
            )}

            {wizard.state.step === 2 && (
              <StepTwoTags
                instruments={wizard.state.instruments}
                genres={wizard.state.genres}
                onToggleInstrument={wizard.toggleInstrument}
                onToggleGenre={wizard.toggleGenre}
              />
            )}

            {wizard.state.step === 3 && (
              <StepThreePhoto
                avatarUri={wizard.state.avatarUri}
                onChangeAvatarUri={wizard.setAvatarUri}
                error={wizard.state.avatarError}
              />
            )}

            {wizard.state.step === 4 && (
              <StepFourPix
                pixKeyType={wizard.state.pixKeyType}
                pixKey={wizard.state.pixKey}
                onChangeType={wizard.setPixKeyType}
                onChangeKey={wizard.setPixKey}
                prefillCpf={authUser?.cpf}
                prefillPhone={authUser?.phone}
                prefillEmail={authUser?.email}
                error={wizard.state.pixError}
              />
            )}

            {wizard.state.step === 5 && (
              <StepFiveQrReveal qrCode={wizard.state.qrCode} onGoHome={handleGoHome} />
            )}

            {wizard.state.step === 1 && <WizardStepFooter onAdvance={handleAdvanceStep1} />}
            {wizard.state.step === 2 && (
              <WizardStepFooter
                error={wizard.state.step2Error}
                loading={isUpdatingMusician}
                disabled={!step2Valid}
                onAdvance={handleAdvanceStep2}
              />
            )}
            {wizard.state.step === 3 && (
              <WizardStepFooter
                error={wizard.state.avatarError}
                loading={isUploadingAvatar}
                onAdvance={handleUploadAvatar}
                onSkip={wizard.advanceToStep4}
              />
            )}
            {wizard.state.step === 4 && (
              <WizardStepFooter
                error={wizard.state.pixError}
                loading={isSavingPixKey}
                onAdvance={handleSavePix}
                onSkip={wizard.advanceToStep5}
                skipLabel="Pular por enquanto (sem receber pagamentos)"
              />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  progressWrap: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  backBtn: {
    position:       'absolute',
    top:             spacing.lg,
    left:            spacing.lg,
    width:           48,
    height:          48,
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:          10,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxl,
    paddingBottom:     spacing.xxxl,
    flexGrow:           1,
    justifyContent:     'center',
  },
});
