/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling these Node.js-only packages.
  serverExternalPackages: ['nodemailer', '@prisma/client', '.prisma/client'],
}

export default nextConfig
