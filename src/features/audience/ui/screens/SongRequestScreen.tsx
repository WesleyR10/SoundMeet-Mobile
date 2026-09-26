import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { extractApiMessage } from '@/shared/services/http/types';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanStackScreenProps } from '@/navigation/types';
import { useAttendEvent } from '../../application/useAttendEvent';
import { useSongRequestForm } from '../../application/useSongRequestForm';
import { useMakeMusicRequest, useRequestSuggestions } from '../../application/useSongRequest';
import { PickedSongSummary } from '../components/PickedSongSummary';
import { RepertoirePicker } from '../components/RepertoirePicker';
import { RequestBoostSection, BOOST_MIN_AMOUNT } from '../components/RequestBoostSection';
import { SongRequestSuccess } from '../components/SongRequestSuccess';
import { SongSuggestionChips } from '../components/SongSuggestionChips';
import { ThemedStatusBar } from '@/shared/components/ThemedStatusBar';

type Props = FanStackScreenProps<'SongRequest'>;

const useStyles = makeStyles((colors) => ({
  root:   { flex: 1, backgroundColor: colors.bg.primary },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
  title:    { ...typography.displayMd, color: colors.text.primary },
  subtitle: { ...typography.body,      color: colors.text.secondary },
  boostHint: {
    ...typography.caption,
    color:      colors.text.muted,
    textAlign:  'center',
    marginTop:  -spacing.sm,
    lineHeight: 15,
  },
}));

export function SongRequestScreen({ route, navigation }: Props) {
  const s = useStyles();
  const { musicianId, eventId, establishmentId } = route.params;
  const audienceId = useAuthStore((state) => state.user?.audienceId ?? null);

  const form = useSongRequestForm(musicianId);
  const [boostAmount, setBoostAmount] = useState<number | null>(null);
  const [dedication, setDedication] = useState('');

  const attendEventMutation = useAttendEvent(audienceId);
  const requestMutation     = useMakeMusicRequest(audienceId);
  const { data: suggestionsData } = useRequestSuggestions(musicianId);

  // Pré-requisito silencioso: CanMakeRequestPolicy exige is_audience_attendee
  // antes de aceitar o pedido — registra presença assim que a tela abre.
  // Best-effort: se já for attendee, o backend deve tratar como idempotente;
  // se falhar, o erro real aparece só no submit do pedido em si.
  useEffect(() => {
    if (establishmentId && audienceId) attendEventMutation.mutate({ eventId, establishmentId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O destaque só entra no payload quando é válido. Mandar um valor abaixo do
  // piso daria 422 do servidor — a policy `BoostMinimumAmountPolicy` é a fonte
  // da verdade, esta checagem só evita a viagem.
  const hasValidBoost = boostAmount !== null && boostAmount >= BOOST_MIN_AMOUNT;

  function handleSubmit() {
    requestMutation.mutate({
      musician_id:      musicianId,
      song_title:       form.songTitle.trim(),
      artist_name:      form.artistName.trim(),
      event_id:         eventId,
      establishment_id: establishmentId,
      message:          form.message.trim() || undefined,
      // Só quando veio do catálogo E o texto ainda corresponde: é o único
      // momento em que o gênero é um fato do repertório do artista, e não um
      // palpite. Quem decide é `catalogGenre` (domain/song-request.rules.ts).
      ...(form.genre ? { genre: form.genre } : {}),
      /*
       * 🔴 `library_id` é a linha DESTE músico para a música escolhida — o que
       * amarra o pedido à biblioteca dele em vez de deixá-lo só como texto.
       * Vai em `metadata` porque é onde `MakeMusicRequestUseCase` o lê antes
       * de repassar ao `CreateRequestUseCase`.
       *
       * Omitido quando não há: `metadata` é `@IsObject()` e um
       * `library_id: null` lá dentro viraria um `library_id` inválido no
       * agregado, que exige UUID.
       */
      ...(form.libraryId ? { metadata: { library_id: form.libraryId } } : {}),
      ...(hasValidBoost
        ? {
            boost: {
              amount: boostAmount,
              ...(dedication.trim() ? { dedication: dedication.trim() } : {}),
            },
          }
        : {}),
    });
  }

  if (requestMutation.isSuccess) {
    const boost = requestMutation.data.request_metadata.boost;
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ThemedStatusBar />
        <SongRequestSuccess
          audienceId={audienceId}
          songTitle={form.songTitle.trim()}
          artistName={form.artistName.trim()}
          pointsEarned={requestMutation.data.points_earned}
          boostAmount={boost?.is_boosting === true ? boost.amount ?? 0 : null}
          onDone={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ThemedStatusBar />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        // Sem isto, o primeiro toque num resultado do catálogo só fecharia o
        // teclado — o fã tocaria duas vezes para escolher uma música.
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>Pedir uma música</Text>
        <Text style={s.subtitle}>
          {form.isRestricted
            ? 'Escolha uma música do repertório deste artista.'
            : 'Escolha a música que você quer ouvir agora.'}
        </Text>

        <RepertoirePicker
          items={form.catalogItems}
          isPending={form.catalogPending}
          query={form.catalogQuery}
          onChangeQuery={form.setCatalogQuery}
          scope={form.scope}
          selected={form.pickedSong}
          onSelect={form.selectFromCatalog}
        />

        {/*
          Sugestões vêm do HISTÓRICO de pedidos, não do catálogo — não há
          `library_id` por trás. No modo restrito elas levariam o fã a um
          pedido que o servidor recusa, então ficam de fora.
        */}
        {!form.isRestricted && (
          <SongSuggestionChips
            suggestions={suggestionsData?.suggestions ?? []}
            onSelect={form.selectSuggestion}
          />
        )}

        {/*
          🔴 Sem texto livre no modo restrito. Os campos continuariam
          preenchidos pela escolha, mas editáveis — e qualquer edição faria o
          pedido perder o `library_id` e levar 422 no envio. Aqui a escolha no
          catálogo É o pedido; o resumo abaixo mostra o que foi escolhido.
        */}
        {form.isRestricted ? (
          <PickedSongSummary title={form.songTitle} artist={form.artistName} />
        ) : (
          <>
            <FormField label="Música"  value={form.songTitle}  onChangeText={form.changeTitle}  placeholder="Nome da música"  autoCapitalize="sentences" />
            <FormField label="Artista" value={form.artistName} onChangeText={form.changeArtist} placeholder="Nome do artista" autoCapitalize="sentences" />
          </>
        )}

        <FormField label="Mensagem (opcional)" value={form.message} onChangeText={form.setMessage} placeholder="Deixe um recado..." autoCapitalize="sentences" multiline />

        {/*
          Só aparece quando o músico tem conta de pagamento vinculada
          (`accepts_tips`, servido junto das sugestões). Oferecer o destaque a
          quem não pode receber seria oferecer algo que a API vai recusar.
        */}
        {suggestionsData?.accepts_tips && (
          <RequestBoostSection
            amount={boostAmount}
            onAmountChange={setBoostAmount}
            dedication={dedication}
            onDedicationChange={setDedication}
            songTitle={form.songTitle}
            artistName={form.artistName}
          />
        )}

        {requestMutation.isError && <ErrorBanner message={extractApiMessage(requestMutation.error)} />}

        <PrimaryButton
          label={hasValidBoost ? `Pedir com destaque de R$ ${boostAmount.toFixed(2).replace('.', ',')}` : 'Enviar pedido'}
          variant={hasValidBoost ? 'coral' : 'brand'}
          onPress={handleSubmit}
          disabled={!form.isComplete || requestMutation.isPending}
          loading={requestMutation.isPending}
        />

        {hasValidBoost && (
          <Text style={s.boostHint}>
            Nada é cobrado agora. Se o artista aceitar, você recebe o PIX pra
            concluir.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
