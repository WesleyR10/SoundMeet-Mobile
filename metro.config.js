const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Path aliases — espelha tsconfig.json paths
config.resolver.alias = {
  '@/app':        path.resolve(__dirname, 'src/app'),
  '@/features':   path.resolve(__dirname, 'src/features'),
  '@/navigation': path.resolve(__dirname, 'src/navigation'),
  '@/shared':     path.resolve(__dirname, 'src/shared'),
};

// Stub de framer-motion: moti v0.30 usa framer-motion (lib de DOM) internamente.
// O stub fornece PresenceContext + usePresence() compatíveis com React Native,
// desabilitando apenas animações de saída (prop `exit`) — enter/animate continuam.
config.resolver.extraNodeModules = {
  'framer-motion': path.resolve(__dirname, 'src/shared/stubs/framer-motion.js'),
};

module.exports = withNativeWind(config, {
  input: './global.css',
});
