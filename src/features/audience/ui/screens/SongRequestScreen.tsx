import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
import { RepertoirePicker } from '../components/RepertoirePicker';
import { RequestBoostSection, BOOST_MIN_AMOUNT } from '../components/RequestBoostSection';
import { SongRequestSuccess } from '../components/SongRequestSuccess';
import { SongSuggestionChips } from '../components/SongSuggestionChips';

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
        <StatusBar style="light" />
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
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        // Sem isto, o primeiro toque num resultado do catálogo só fecharia o
        // teclado — o fã tocaria duas vezes para escolher uma música.
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>Pedir uma música</Text>
        <Text style={s.subtitle}>Escolha a música que você quer ouvir agora.</Text>

        <RepertoirePicker
          items={form.catalogItems}
          isPending={form.catalogPending}
          query={form.catalogQuery}
          onChangeQuery={form.setCatalogQuery}
          selectedId={form.pickedSong?.id ?? null}
          onSelect={form.selectFromCatalog}
        />

        <SongSuggestionChips
          suggestions={suggestionsData?.suggestions ?? []}
          onSelect={form.selectSuggestion}
        />

        <FormField label="Música"  value={form.songTitle}  onChangeText={form.changeTitle}  placeholder="Nome da música"  autoCapitalize="sentences" />
        <FormField label="Artista" value={form.artistName} onChangeText={form.changeArtist} placeholder="Nome do artista" autoCapitalize="sentences" />
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
