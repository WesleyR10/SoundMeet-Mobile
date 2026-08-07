const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

// getSentryExpoConfig substitui getDefaultConfig — mesmo config do Expo,
// mais o resolver que anexa debug id nos bundles (necessário pra symbolicar
// stack traces de produção no Sentry). Sem SENTRY_AUTH_TOKEN no ambiente de
// build, essa etapa é ignorada — não bloqueia build local nem CI sem Sentry.
const config = getSentryExpoConfig(__dirname);

// Path aliases — espelha tsconfig.json paths
config.resolver.alias = {
  '@/app':        path.resolve(__dirname, 'src/app'),
  '@/features':   path.resolve(__dirname, 'src/features'),
  '@/navigation': path.resolve(__dirname, 'src/navigation'),
  '@/shared':     path.resolve(__dirname, 'src/shared'),
};

// NativeWind removido (jul/2026): zero `className` em src/ e o
// react-native-css-interop v0.2.x substituía o JSX runtime, quebrando hooks em
// Expo SDK 56 + New Architecture. Estilo é 100% StyleSheet.create + tokens.ts.
// Reavaliar se o NativeWind v5 (reescrita New Arch) sair compatível.
module.exports = config;
