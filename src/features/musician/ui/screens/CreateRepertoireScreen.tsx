import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { repertoireNameSchema, type RepertoireNameFormValues } from '../../domain/repertoire.validation';
import { useCreateRepertoire, getRepertoireMutationErrorMessage } from '../../application/useRepertoireMutations';
import type { RepertoireScreenProps } from '@/navigation/types';

type Props = RepertoireScreenProps<'CreateRepertoire'>;

// Form standalone de 1 campo, 1 submit — Zod + react-hook-form via Controller
// (CLAUDE.md "Formulários — Zod + React Hook Form"). Gate de plano
// (max_repertoires) retorna 402 — extractApiMessage já extrai a mensagem do
// PlanLimitExceededError do backend, exibida no ErrorBanner.
export function CreateRepertoireScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const createMutation = useCreateRepertoire(musicianId);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<RepertoireNameFormValues>({
    resolver:      zodResolver(repertoireNameSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setBannerError(null);
    try {
      const repertoire = await createMutation.mutateAsync(values.name);
      navigation.replace('RepertoireDetail', { repertoireId: repertoire.repertoire_id });
    } catch (err) {
      setBannerError(getRepertoireMutationErrorMessage(err));
    }
  });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.body}>
        <Text style={s.title}>Novo repertório</Text>
        <Text style={s.subtitle}>Dê um nome pro seu repertório — você adiciona as músicas depois.</Text>

        {!!bannerError && <ErrorBanner message={bannerError} style={s.banner} />}

        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FormField
              label="Nome do repertório"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Setlist Principal"
              autoCapitalize="sentences"
              error={fieldState.error?.message}
            />
          )}
        />

        <PrimaryButton
          label="Criar repertório"
          onPress={onSubmit}
          loading={createMutation.isPending}
          style={s.submitBtn}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  backBtn: {
    position:       'absolute',
    top:             spacing.lg,
    left:            spacing.lg,
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  body: {
    flex:              1,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxxl + spacing.lg,
    gap:                spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color:      colors.text.secondary,
    marginTop: -spacing.sm,
  },
  banner: {
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
