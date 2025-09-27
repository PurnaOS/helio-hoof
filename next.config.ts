import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: swcMinify is enabled by default in Next.js 15

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Optimize images
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ["@anthropic-ai/sdk"],

  // Experimental features for better performance
  experimental: {
    // Enable static optimization
    optimizePackageImports: ["lucide-react", "@react-pdf/renderer"],

    // Speed up cold starts
    serverMinification: true,
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    // Performance optimizations
    config.optimization.providedExports = true;
    config.optimization.usedExports = true;

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/sign-up",
        permanent: true,
      },
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by CI/CD
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Linting is handled by CI/CD
    ignoreDuringBuilds: false,
  },

  // Output configuration for Vercel
  output: "standalone",

  // Explicitly set the workspace root to suppress warnings about multiple lockfiles
  outputFileTracingRoot: __dirname,

  // Note: poweredByHeader already set above

  // Optimize server-side rendering
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
