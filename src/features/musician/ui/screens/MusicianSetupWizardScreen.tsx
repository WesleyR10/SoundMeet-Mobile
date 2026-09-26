import { useEffect } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { spacing } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { musicianWizardGateKey, useMusicianWizardGate } from '../../application/useMusicianWizardGate';
import { useMusicianWallet } from '../../application/useMusicianWallet';
import { previousStep } from '../../domain/wizard.rules';
import type { MusicianProfile } from '../../domain/musician.types';
import { useMusicianWizardState } from './useMusicianWizardState';
import { useMusicianWizardHandlers } from './useMusicianWizardHandlers';
import { WizardBackground } from '../components/WizardBackground';
import { WizardProgress } from '../components/WizardProgress';
import { WizardStepFooter } from '../components/WizardStepFooter';
import { WizardBackButton } from '../components/WizardBackButton';
import { StepOneIdentity } from '../components/StepOneIdentity';
import { StepTwoTags } from '../components/StepTwoTags';
import { StepThreePhoto } from '../components/StepThreePhoto';
import { StepFourPix } from '../components/StepFourPix';
import { StepFiveQrReveal } from '../components/StepFiveQrReveal';
import { ThemedStatusBar } from '@/shared/components/ThemedStatusBar';

// Único screen com estado interno de step (não 5 entradas de stack) — o background
// teal→violeta e o WizardProgress precisam de continuidade visual entre steps, que
// um push/pop de navigation destruiria. VOLTAR existe em todo passo depois do
// primeiro (seta, back do Android e toque nas etapas já feitas do topo): refazer
// nome/estilo é seguro, porque o "Continuar" do passo 2 repete um PATCH
// idempotente. Até 25/set/2026 só o passo 2 voltava. Handlers assíncronos vivem em
// useMusicianWizardHandlers.ts (limite de ~200 linhas por screen — CLAUDE.md).
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  progressWrap: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxl,
    paddingBottom:     spacing.xxxl,
    flexGrow:           1,
    justifyContent:     'center',
  },
}));

export function MusicianSetupWizardScreen() {
  const s = useStyles();
  const authUser = useAuthStore((s) => s.user);
  const musicianId = authUser?.musicianId ?? null;
  const queryClient = useQueryClient();
  // Mesma query (dedupada pelo TanStack Query) já resolvida pelo RootNavigator
  // antes de montar este screen — só para saber em que step retomar (1.20: se
  // stage_name já existe mas o wizard nunca chegou no Step 5, retoma no Step 3
  // em vez de reiniciar do zero).
  const gate = useMusicianWizardGate();
  const resumeStep = gate.kind === 'needs-wizard' ? gate.resumeStep : 1;
  // Perfil já em cache: o RootNavigator só monta esta tela depois de o gate
  // resolvê-lo. Só é lido na montagem (inicializador do reducer).
  const cachedProfile = musicianId
    ? (queryClient.getQueryData<MusicianProfile>(musicianWizardGateKey(musicianId)) ?? null)
    : null;
  const wizard = useMusicianWizardState(resumeStep, cachedProfile);
  const { data: wallet } = useMusicianWallet(musicianId);
  const back = previousStep(wizard.state.step);
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

  // Back do Android volta um passo; no passo 1 continua bloqueado (sair do
  // assistente deixaria o músico sem tela nenhuma para onde ir).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (back) wizard.goBackToStep(back);
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [back]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity:   contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <SafeAreaView style={s.root}>
      <ThemedStatusBar />
      <WizardBackground progress={progress} step={wizard.state.step} />

      <View style={s.progressWrap}>
        <WizardProgress step={wizard.state.step} onStepPress={wizard.goBackToStep} />
      </View>

      {back && <WizardBackButton onPress={() => wizard.goBackToStep(back)} />}

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
                busy={isUploadingAvatar}
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
                skipLabel={cachedProfile?.avatar ? 'Manter a foto atual' : undefined}
              />
            )}
            {wizard.state.step === 4 && (
              <WizardStepFooter
                error={wizard.state.pixError}
                loading={isSavingPixKey}
                onAdvance={handleSavePix}
                onSkip={wizard.advanceToStep5}
                skipLabel={
                  wallet?.pix_key ? 'Manter a chave atual' : 'Pular por enquanto (sem receber pagamentos)'
                }
              />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
