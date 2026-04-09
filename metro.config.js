const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep non-default asset extensions we use.
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts, 'avif'],
};

module.exports = config;
