/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'unsafe-eval' *.vercel-insights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' *.googleapis.com *.stripe.com; frame-src 'none'; base-uri 'none'; form-action 'self'`
  }
];

const nextConfig = {
  output: 'standalone',
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru'],
    defaultLocale: 'en',
    localeDetection: false, // Changed from true to false
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/invoices/:id.pdf',
        destination: '/api/invoices/[id]/receipt'
      },
      {
        source: '/crypto-payment/:invoiceId',
        destination: '/components/Invoice/PaymentQR'
      }
    ]
  }
};

module.exports = nextConfig;
