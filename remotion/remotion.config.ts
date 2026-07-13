import { Config } from '@remotion/cli/config';

// Loop de fundo é decorativo (mobile) — prioriza arquivo pequeno sobre qualidade máxima.
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(30);
Config.setPixelFormat('yuv420p');
// player.muted no app já silencia, mas sem isso o Remotion ainda escreve uma trilha AAC
// (o `muted` do <OffthreadVideo> só afeta mixagem daquele asset, não o container final).
Config.setMuted(true);
