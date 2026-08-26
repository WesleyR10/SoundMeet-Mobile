import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Music4 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { SpotifyTrackCandidate } from '../../domain/spotify.types';

type Props = {
  track:     SpotifyTrackCandidate;
  isSaving:  boolean;
  onConfirm: () => void;
  onReject:  () => void;
};

/**
 * "É esta?" — o passo que impede salvar a faixa errada.
 *
 * Capa, título, artista e álbum juntos são o que deixa a pessoa reconhecer em
 * um relance se o catálogo devolveu a versão certa. Sem a capa, "Garota de
 * Ipanema — Tom Jobim" descreve dezenas de gravações diferentes.
 */
export function SpotifyTrackConfirmCard({
  track,
  isSaving,
  onConfirm,
  onReject,
}: Props) {
  return (
    <View style={s.box}>
      <Text style={s.title}>É esta?</Text>

      <View style={s.trackRow}>
        {track.artwork_url ? (
          <Image source={{ uri: track.artwork_url }} style={s.artwork} />
        ) : (
          <View style={[s.artwork, s.artworkFallback]}>
            <Music4 size={18} color={colors.text.muted} />
          </View>
        )}

        <View style={s.info}>
          <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{track.artist}</Text>
          {!!track.album && (
            <Text style={s.album} numberOfLines={1}>{track.album}</Text>
          )}
        </View>
      </View>

      <View style={s.actions}>
        <Pressable
          onPress={onConfirm}
          disabled={isSaving}
          style={s.confirmBtn}
          accessibilityRole="button"
          accessibilityLabel="Confirmar e salvar no Spotify"
          accessibilityState={{ disabled: isSaving }}
        >
          <Text style={s.confirmText}>{isSaving ? 'Salvando…' : 'Salvar'}</Text>
        </Pressable>

        <Pressable
          onPress={onReject}
          disabled={isSaving}
          style={s.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel="Não é esta música"
          hitSlop={8}
        >
          <Text style={s.cancelText}>Não é essa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.default,
    padding:         spacing.md,
    gap:             spacing.sm,
  },
  title: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  artwork: {
    width:        56,
    height:       56,
    borderRadius: radius.sm,
  },
  artworkFallback: {
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.bg.surface,
  },
  info: {
    flex: 1,
    gap:  2,
  },
  trackTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  album: {
    ...typography.caption,
    color: colors.text.muted,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.md,
  },
  confirmBtn: {
    flex:            1,
    minHeight:       48,
    borderRadius:    radius.xl,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  confirmText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  cancelBtn: {
    minHeight:      48,
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
  },
});
