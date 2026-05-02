/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Cloudinary (cuando se configure)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Mercado Pago assets
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
    ],
  },
  // El logger de webhooks no debe loguear bodies con PII
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig
