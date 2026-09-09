import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { GENRE_OPTIONS } from '../../domain/musician.constants';
import {
  BAND_DESCRIPTION_MAX,
  BAND_NAME_MAX,
  createBandSchema,
} from '../../domain/band.validation';
import {
  getBandMutationErrorMessage,
  useCreateBand,
} from '../../application/useBandMutations';

type Props = {
  visible: boolean;
  onClose: () => void;
  musicianId: string | null;
  onCreated: (bandId: string) => void;
};

/**
 * Criar banda.
 *
 * Zod-only (`safeParse`), sem react-hook-form: são dois campos e uma seleção de
 * chips, e o botão de enviar mora no próprio sheet. É o mesmo critério já
 * registrado no `CLAUDE.md` para os steps do wizard — RHF aqui só acrescentaria
 * `Controller` sem isolar re-render de nada.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: { backgroundColor: colors.bg.elevated },
  handle: { backgroundColor: colors.border.strong, width: 44 },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  genresBlock: { gap: spacing.sm },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color: colors.text.secondary,
  },
  help: {
    ...typography.caption,
    color: colors.text.muted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
}));

export function CreateBandSheet({ visible, onClose, musicianId, onCreated }: Props) {
  const s = useStyles();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const createBand = useCreateBand(musicianId);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleDismiss = () => {
    setName('');
    setDescription('');
    setGenres([]);
    setFieldError(null);
    createBand.reset();
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const toggleGenre = (id: string) => {
    setFieldError(null);
    setGenres((current) =>
      current.includes(id) ? current.filter((g) => g !== id) : [...current, id],
    );
  };

  const handleSubmit = async () => {
    const parsed = createBandSchema.safeParse({
      name,
      description: description.trim() || undefined,
      genres,
    });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Confira os dados da banda');
      return;
    }

    setFieldError(null);
    try {
      const band = await createBand.mutateAsync({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        genres: parsed.data.genres,
        // `open_to_gigs` fica de fora: nasce indefinido e o líder decide depois,
        // com consentimento explícito. Ver `band.api.ts`.
      });
      handleDismiss();
      onCreated(band.id);
    } catch {
      // Visível no ErrorBanner; o sheet segue aberto com os dados preenchidos.
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing
    >
      {/* ScrollView e não View: a grade de gêneros tem 16 chips e, com o
          teclado aberto, o botão de criar sairia da tela. */}
      <BottomSheetScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Criar banda</Text>
        <Text style={s.subtitle}>Você entra como líder e pode convidar os outros depois.</Text>

        <FormField
          label="Nome da banda"
          value={name}
          onChangeText={(v) => {
            setFieldError(null);
            setName(v.slice(0, BAND_NAME_MAX));
          }}
          placeholder="Ex.: Trio da Esquina"
          autoCapitalize="words"
        />

        <FormField
          label="Descrição (opcional)"
          value={description}
          onChangeText={(v) => setDescription(v.slice(0, BAND_DESCRIPTION_MAX))}
          placeholder="Em uma frase, o que a banda toca"
          multiline
        />

        <View style={s.genresBlock}>
          <Text style={s.label}>Gêneros</Text>
          {/*
            Obrigatório, e o texto diz por quê: o filtro de descoberta do
            estabelecimento é `hasSome` sobre este array. Banda sem gênero nasce
            invisível para quem contrata — e o backend não impõe o mínimo.
          */}
          <Text style={s.help}>É por aqui que os estabelecimentos encontram a banda.</Text>
          <View style={s.chips}>
            {GENRE_OPTIONS.map((option) => (
              <MultiSelectChip
                key={option.id}
                label={option.label}
                selected={genres.includes(option.id)}
                onPress={() => toggleGenre(option.id)}
              />
            ))}
          </View>
        </View>

        {!!fieldError && <ErrorBanner message={fieldError} />}
        {createBand.isError && (
          <ErrorBanner message={getBandMutationErrorMessage(createBand.error)} />
        )}

        <PrimaryButton
          label="Criar banda"
          onPress={handleSubmit}
          loading={createBand.isPending}
          disabled={createBand.isPending}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
