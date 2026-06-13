import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // unsafe-eval only in dev (Next.js fast-refresh needs it); removed in production
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://qwxcwzxnomzusuztemyb.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://qwxcwzxnomzusuztemyb.supabase.co https://*.basemaps.cartocdn.com wss://qwxcwzxnomzusuztemyb.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Block mixed content
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@supabase/supabase-js",
      "@supabase/ssr",
      "react-simple-maps",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
