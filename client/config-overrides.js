// client/config-overrides.js
const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    buffer: require.resolve('buffer/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url/'),
    http: require.resolve('stream-http'),        // Added for 'http'
    https: require.resolve('https-browserify'),  // Added for 'https'
    zlib: require.resolve('browserify-zlib'),    // Added for 'zlib'
    vm: require.resolve('vm-browserify'),    // Added for 'vm'
  };

  // Provide global Buffer (required by Solana libs)
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  return config;
};