
/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
      rules: {
        // Handle externals that were previously in webpack config
        '*.node': {
          loaders: ['ignore-loader'],
        },
      },
      resolveAlias: {
        // Add any alias configurations if needed
      },
    },  // Fallback webpack config for non-Turbopack builds
  webpack: (config: any) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
}


module.exports = nextConfig;