import { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useRepertoire } from '../../application/useRepertoire';
import { repertoireNameSchema, type RepertoireNameFormValues } from '../../domain/repertoire.validation';
import {
  useRenameRepertoire,
  useDeleteRepertoire,
  useShareRepertoire,
  useUnshareRepertoire,
  useInviteMusician,
  useRevokeInvite,
  getRepertoireMutationErrorMessage,
} from '../../application/useRepertoireMutations';
import { EditRepertoireShareSection } from '../components/EditRepertoireShareSection';
import { EditRepertoireInviteSection } from '../components/EditRepertoireInviteSection';
import type { RepertoireScreenProps } from '@/navigation/types';

type Props = RepertoireScreenProps<'EditRepertoire'>;

// Consolida edição + compartilhamento + convites nominais numa tela só
// (precedente: itens 2.4/2.5 do roadmap-mobile.md já fundiram
// Create/EditProfile pelo mesmo motivo — telas separadas seriam puramente
// redundantes pra um repertório que já existe). Seções de share/invite
// extraídas em componentes próprios (limite ~200 linhas/arquivo).
export function EditRepertoireScreen({ navigation, route }: Props) {
  const { repertoireId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: repertoire } = useRepertoire(musicianId, repertoireId);

  const renameMutation = useRenameRepertoire(musicianId, repertoireId);
  const deleteMutation = useDeleteRepertoire(musicianId);
  const shareMutation = useShareRepertoire(musicianId, repertoireId);
  const unshareMutation = useUnshareRepertoire(musicianId, repertoireId);
  const inviteMutation = useInviteMusician(musicianId, repertoireId);
  const revokeMutation = useRevokeInvite(musicianId, repertoireId);

  const [bannerError, setBannerError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<RepertoireNameFormValues>({
    resolver:      zodResolver(repertoireNameSchema),
    values:        repertoire ? { name: repertoire.name } : undefined,
    defaultValues: { name: repertoire?.name ?? '' },
  });

  const onRename = handleSubmit(async (values) => {
    setBannerError(null);
    try {
      await renameMutation.mutateAsync(values.name);
    } catch (err) {
      setBannerError(getRepertoireMutationErrorMessage(err));
    }
  });

  function onDelete() {
    Alert.alert('Excluir repertório', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(repertoireId);
            navigation.navigate('RepertoireList');
          } catch (err) {
            setBannerError(getRepertoireMutationErrorMessage(err));
          }
        },
      },
    ]);
  }

  async function onToggleShare() {
    setBannerError(null);
    try {
      if (repertoire?.is_shared) {
        await unshareMutation.mutateAsync();
      } else {
        const updated = await shareMutation.mutateAsync();
        if (updated.share_token) {
          Share.share({ message: `Confira meu repertório: soundmeet://repertoire/shared/${updated.share_token}` });
        }
      }
    } catch (err) {
      setBannerError(getRepertoireMutationErrorMessage(err));
    }
  }

  async function onInvite(inviteeMusicianId: string) {
    setBannerError(null);
    try {
      await inviteMutation.mutateAsync(inviteeMusicianId);
    } catch (err) {
      setBannerError(getRepertoireMutationErrorMessage(err));
    }
  }

  if (!repertoire) return null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Gerenciar repertório</Text>

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
              autoCapitalize="sentences"
              error={fieldState.error?.message}
            />
          )}
        />
        <PrimaryButton label="Salvar nome" onPress={onRename} loading={renameMutation.isPending} />

        <EditRepertoireShareSection isShared={repertoire.is_shared} onToggle={onToggleShare} />

        <EditRepertoireInviteSection
          ownMusicianId={musicianId}
          onInvite={onInvite}
          inviteLoading={inviteMutation.isPending}
          invitees={repertoire.invitees}
          onRevoke={(inviteeId) => revokeMutation.mutate(inviteeId)}
        />

        <Pressable onPress={onDelete} style={s.deleteBtn} accessibilityRole="button" accessibilityLabel="Excluir repertório">
          <Trash2 size={18} color={colors.status.error} />
          <Text style={s.deleteText}>Excluir repertório</Text>
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxxl + spacing.lg,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  banner: {},
  deleteBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.sm,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        `${colors.status.error}59`,
    paddingVertical:    spacing.md,
    marginTop:          spacing.md,
    ...shadows.sm,
  },
  deleteText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.error,
  },
});
