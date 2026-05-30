import type { NextConfig } from "next";

const isAnalyze = process.env.ANALYZE === 'true';
let withBundleAnalyzer: (c: any) => any = (c) => c;
if (isAnalyze) {
  try {
    // Lazy require so missing devDependency doesn't break dev server
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
  } catch (e) {
    // If not installed, continue without analyzer
    // eslint-disable-next-line no-console
    console.warn('Bundle analyzer not installed; ANALYZE ignored.');
    withBundleAnalyzer = (c: any) => c;
  }
}

const nextConfig: NextConfig = withBundleAnalyzer({
  /* ===== PERFORMANCE OPTIMIZATIONS ===== */
  
  // Image Optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains - restrict as needed
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1280, 1440, 1600, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache images for 1 year
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression and Minification
  compress: true,
  productionBrowserSourceMaps: false,
  
  // ===== SECURITY HEADERS =====
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // 👇 ADDED FOR FFMPEG.WASM (SharedArrayBuffer support) 👇
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // ===== REDIRECTS FOR SECURITY =====
  redirects: async () => {
    return [
      {
        source: '/:path*.map',
        destination: '/404',
        permanent: true,
      },
      {
        source: '/api/:path*(.js|.ts)',
        destination: '/404',
        permanent: true,
      },
    ];
  },

  // ===== TYPESCRIPT =====
  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  // ===== ENVIRONMENT =====
  env: {
    BUILD_TIME: new Date().toISOString(),
  },

  // ===== EXPERIMENTAL FEATURES =====
  experimental: {
    // Enables faster builds
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
});

export default nextConfig;