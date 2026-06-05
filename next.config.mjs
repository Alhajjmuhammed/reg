/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/masterclass',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
