import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PartyPopper } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { extractApiMessage } from '@/shared/services/http/types';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { FanStackScreenProps } from '@/navigation/types';
import { useAttendEvent } from '../../application/useAttendEvent';
import { useMakeMusicRequest, useRequestSuggestions } from '../../application/useSongRequest';
import { SongSuggestionChips } from '../components/SongSuggestionChips';

type Props = FanStackScreenProps<'SongRequest'>;

export function SongRequestScreen({ route, navigation }: Props) {
  const { musicianId, eventId, establishmentId } = route.params;
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);

  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [message, setMessage] = useState('');

  const attendEventMutation = useAttendEvent(audienceId);
  const requestMutation      = useMakeMusicRequest(audienceId);
  const { data: suggestionsData } = useRequestSuggestions(musicianId);

  // Pré-requisito silencioso: CanMakeRequestPolicy exige is_audience_attendee
  // antes de aceitar o pedido — registra presença assim que a tela abre.
  // Best-effort: se já for attendee, o backend deve tratar como idempotente;
  // se falhar, o erro real aparece só no submit do pedido em si.
  useEffect(() => {
    if (establishmentId && audienceId) attendEventMutation.mutate({ eventId, establishmentId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectSuggestion(suggestion: { song_title: string; artist?: string }) {
    setSongTitle(suggestion.song_title);
    if (suggestion.artist) setArtistName(suggestion.artist);
  }

  function handleSubmit() {
    requestMutation.mutate({
      musician_id: musicianId,
      song_title:  songTitle.trim(),
      artist_name: artistName.trim(),
      event_id:    eventId,
      establishment_id: establishmentId,
      message:     message.trim() || undefined,
    });
  }

  if (requestMutation.isSuccess) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.successRoot}>
          <PartyPopper size={56} color={colors.brand.primary} />
          <Text style={s.successTitle}>Pedido enviado!</Text>
          <Text style={s.successSubtitle}>
            +{requestMutation.data.points_earned} pontos ganhos. O músico vai ver seu pedido em breve.
          </Text>
          <PrimaryButton label="Voltar ao perfil" onPress={() => navigation.goBack()} style={s.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = songTitle.trim().length > 0 && artistName.trim().length > 0 && !requestMutation.isPending;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Pedir uma música</Text>
        <Text style={s.subtitle}>Escolha a música que você quer ouvir agora.</Text>

        <SongSuggestionChips suggestions={suggestionsData?.suggestions ?? []} onSelect={handleSelectSuggestion} />

        <FormField label="Música" value={songTitle} onChangeText={setSongTitle} placeholder="Nome da música" autoCapitalize="sentences" />
        <FormField label="Artista" value={artistName} onChangeText={setArtistName} placeholder="Nome do artista" autoCapitalize="sentences" />
        <FormField label="Mensagem (opcional)" value={message} onChangeText={setMessage} placeholder="Dedique um recado..." autoCapitalize="sentences" multiline />

        {requestMutation.isError && <ErrorBanner message={extractApiMessage(requestMutation.error)} />}

        <PrimaryButton
          label="Enviar pedido"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={requestMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  successRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.md,
    paddingHorizontal: spacing.xl,
  },
  successTitle: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  successSubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  successBtn: {
    marginTop: spacing.lg,
    width:     '100%',
  },
});
