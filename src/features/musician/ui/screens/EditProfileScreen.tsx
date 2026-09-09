import { useState } from 'react';
import { View, Alert, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList, SkeletonProfileHeader } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import { useEditProfileForm } from './useEditProfileForm';
import { EditProfileAccordionList, type SectionId } from '../components/EditProfileAccordionList';
import type { MusicianProfile } from '../../domain/musician.types';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'EditProfile'>;

const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  loaderRoot: {
    flex:            1,
    backgroundColor: colors.bg.primary,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
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
  flex: {
    flex: 1,
  },
  scroll: {
    padding:       spacing.xl,
    paddingTop:    spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxxl,
    gap:            spacing.md,
  },
  title: {
    ...typography.displayMd,
    color:        colors.text.primary,
    marginBottom: spacing.sm,
  },
  avatarError: {
    marginBottom: spacing.sm,
  },
}));

export function EditProfileScreen({ navigation }: Props) {
  const s = useStyles();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: musician, isPending, isError, refetch } = useMusician(musicianId);

  if (isPending) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.skeleton}>
          <SkeletonProfileHeader avatarSize={72} />
          {/* O formulário é uma pilha de accordions fechados. */}
          <SkeletonList count={5} itemHeight={64} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !musician || !musicianId) {
    return (
      <SafeAreaView style={s.loaderRoot} edges={['top']}>
        <StatusBar style="light" />
        <ErrorBanner message="Não conseguimos carregar seu perfil." />
        <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
          <Text style={s.retryText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <EditProfileAccordion
      musician={musician}
      musicianId={musicianId}
      onGoBack={() => navigation.goBack()}
    />
  );
}

type AccordionProps = {
  musician:   MusicianProfile;
  musicianId: string;
  onGoBack:   () => void;
};

function EditProfileAccordion({ musician, musicianId, onGoBack }: AccordionProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const [openId, setOpenId] = useState<SectionId | null>('identity');

  const {
    control, avatarUri, handleChangeAvatar,
    instrumentIds, toggleInstrument, genreIds, toggleGenre,
    bannerError, sections, location, touring, wallet, qrCode, availability, isDirty,
  } = useEditProfileForm(musician, musicianId);

  const toggle = (id: SectionId) => setOpenId((prev) => (prev === id ? null : id));

  const handleGoBack = () => {
    if (!isDirty) {
      onGoBack();
      return;
    }
    Alert.alert(
      'Alterações não salvas',
      'Você tem alterações não salvas nesta tela. Sair mesmo assim?',
      [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Sair sem salvar', style: 'destructive', onPress: onGoBack },
      ],
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <Pressable onPress={handleGoBack} style={s.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Editar perfil</Text>

          {!!bannerError && <ErrorBanner message={bannerError} style={s.avatarError} />}

          <EditProfileAccordionList
            musician={musician}
            control={control}
            avatarUri={avatarUri}
            handleChangeAvatar={handleChangeAvatar}
            instrumentIds={instrumentIds}
            toggleInstrument={toggleInstrument}
            genreIds={genreIds}
            toggleGenre={toggleGenre}
            sections={sections}
            location={location}
            touring={touring}
            wallet={wallet}
            qrCode={qrCode}
            availability={availability}
            openId={openId}
            onToggle={toggle}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
