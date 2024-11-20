// Human Tasks:
// 1. Verify Vercel deployment settings in Vercel dashboard match configuration
// 2. Ensure all required environment variables are set in Vercel project settings
// 3. Validate CDN and edge function configurations in Vercel dashboard
// 4. Review Content Security Policy headers for any required adjustments

// @ts-check
const postcssConfig = require('./postcss.config.js');
const tailwindConfig = require('./tailwind.config.js');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // REQ: Performance Optimization - Enable React Strict Mode for better development and performance
  reactStrictMode: true,

  // REQ: Edge Function Support - Enable experimental features for edge functions and server components
  experimental: {
    appDir: true,
    serverActions: true,
    serverComponents: true,
  },

  // Build output configuration
  output: 'standalone',
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  productionBrowserSourceMaps: false,

  // REQ: Performance Optimization - Enable SWC minification and other optimizations
  swcMinify: true,
  optimizeFonts: true,
  optimizeImages: true,

  // Image optimization configuration
  images: {
    domains: ['supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // Compiler options
  compiler: {
    styledComponents: true,
    removeConsole: true,
  },

  // REQ: Global CDN Distribution - Configure deployment settings for global edge network
  // Vercel deployment configuration
  regions: 'all',
  target: 'server',
  runtime: 'nodejs18.x',

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // REQ: Performance Optimization - Configure security and caching headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security Headers
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Cache Headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'Surrogate-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
    ];
  },

  // PostCSS and Tailwind configuration integration
  postcss: postcssConfig,
  tailwind: {
    config: tailwindConfig,
  },
};

module.exports = nextConfig;