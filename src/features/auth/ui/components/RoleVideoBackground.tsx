import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

import { musicianVideoSource, fanVideoSource } from '@/shared/constants/role-video-sources';
import type { RegisterRole } from '@/features/auth/domain/auth.types';

type Props = {
  role: RegisterRole | null;
};

// Substitui o glow ambiente (AuthGlowBackground) por um loop de vídeo temático assim que
// o usuário escolhe um papel — cards e textos continuam por cima, com scrim escuro por
// baixo deles pra manter contraste/legibilidade sobre o vídeo em movimento.
//
// Os dois players são criados sempre (regra dos hooks — useVideoPlayer não pode ser
// condicional), mas só o player do role ativo toca; o outro fica pausado.
//
// IMPORTANTE: nada aqui anima opacity/transform sobre a VideoView (crossfade animado já
// causou tela preta permanente — ver histórico). E cada player tem sua PRÓPRIA VideoView,
// montada uma vez só e nunca desmontada/trocada — trocar o `player` de uma VideoView já
// existente (ou desmontar/remontar ao alternar role) não rebinda de forma confiável no
// Android, o que fazia o segundo role escolhido nunca aparecer. Troca de role só alterna
// opacidade estática entre as duas views já montadas, sem recriar nenhuma superfície nativa.
const useStyles = makeStyles((colors) => ({
  scrim: {
    backgroundColor: colors.bg.overlay,
  },
  hidden: {
    opacity: 0,
  },
}));

export function RoleVideoBackground({ role }: Props) {
  const s = useStyles();
  const musicianPlayer = useVideoPlayer(musicianVideoSource, (player) => {
    player.loop = true;
    player.muted = true;
  });
  const fanPlayer = useVideoPlayer(fanVideoSource, (player) => {
    player.loop = true;
    player.muted = true;
  });

  const { status: musicianStatus } = useEvent(musicianPlayer, 'statusChange', { status: musicianPlayer.status });
  const { status: fanStatus } = useEvent(fanPlayer, 'statusChange', { status: fanPlayer.status });

  const musicianVisible = role === 'musician' && musicianStatus === 'readyToPlay';
  const fanVisible = role === 'audience' && fanStatus === 'readyToPlay';

  useEffect(() => {
    if (role === 'musician') {
      musicianPlayer.play();
      fanPlayer.pause();
    } else if (role === 'audience') {
      fanPlayer.play();
      musicianPlayer.pause();
    } else {
      musicianPlayer.pause();
      fanPlayer.pause();
    }
  }, [role, musicianPlayer, fanPlayer]);

  if (!role) return null;

  // O scrim só faz sentido por cima de um vídeo de verdade visível — do contrário fica um
  // véu escuro de 72% cobrindo o glow (ou nada) enquanto o vídeo ainda carrega.
  const anyVisible = musicianVisible || fanVisible;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView
        player={musicianPlayer}
        style={[StyleSheet.absoluteFill, !musicianVisible && s.hidden]}
        contentFit="cover"
        nativeControls={false}
        // SurfaceView (padrão no Android) compõe numa janela nativa separada e pode
        // "piscar"/cortar quando outras views com elevation (os RoleCard logo acima)
        // ficam por cima — TextureView compõe na hierarquia normal, sem esse conflito.
        surfaceType="textureView"
      />
      <VideoView
        player={fanPlayer}
        style={[StyleSheet.absoluteFill, !fanVisible && s.hidden]}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
      {anyVisible && <View style={[StyleSheet.absoluteFill, s.scrim]} />}
    </View>
  );
}
