// Fontes locais dos loops de vídeo do RoleSelectionScreen — compartilhado entre App.tsx
// (prefetch no boot) e RoleVideoBackground.tsx (player), pra não duplicar o require()
// de caminho relativo frágil em dois arquivos.
export const musicianVideoSource = require('../../../assets/videos/musician-loop.mp4');
export const fanVideoSource = require('../../../assets/videos/fan-loop.mp4');
