/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Prevent Next.js from bundling nodemailer — it uses Node.js built-ins (net, tls)
  // that cannot be bundled by Webpack/Turbopack. Must run as an external at runtime.
  serverExternalPackages: ['nodemailer'],
}

export default nextConfig
