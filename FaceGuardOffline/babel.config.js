module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@src': './src',
          '@constants': './src/constants',
          '@types': './src/types',
          '@ml': './src/ml',
          '@db': './src/db',
          '@sync': './src/sync',
          '@hooks': './src/hooks',
          '@screens': './src/screens',
          '@components': './src/components',
          '@utils': './src/utils',
          '@navigation': './src/navigation',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
