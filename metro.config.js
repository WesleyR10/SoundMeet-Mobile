const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Path aliases — espelha tsconfig.json paths
// Expo SDK 56 + Metro resolvem @/* → src/* automaticamente via tsconfig.json,
// mas declarar explicitamente aqui garante resolução no runtime (não só no TS).
config.resolver.alias = {
  '@/app':        path.resolve(__dirname, 'src/app'),
  '@/features':   path.resolve(__dirname, 'src/features'),
  '@/navigation': path.resolve(__dirname, 'src/navigation'),
  '@/shared':     path.resolve(__dirname, 'src/shared'),
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
