/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack is now stable in Next.js 15
  // Use it by running: npm run dev --turbo
  experimental: {
    turbo: {
      // Turbopack configuration
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    },
  },
  // External packages that should not be bundled
  serverExternalPackages: ['undici'],
}

module.exports = nextConfig
