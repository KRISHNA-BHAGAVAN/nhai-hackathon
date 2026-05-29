const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    assetExts: [...assetExts, 'tflite', 'task', 'bin'],
    sourceExts: [...sourceExts, 'ts', 'tsx'],
  },
});
