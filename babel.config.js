module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
    ],
    plugins: [
      // react-native-reanimated/plugin → proxy para react-native-worklets/plugin (v4.x)
      'react-native-reanimated/plugin',
    ],
  };
};
