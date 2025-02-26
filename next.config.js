/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Since this will be hosted on CloudFront/S3, we need to disable image optimization
  images: {
    unoptimized: true,
  },
  // Add base path for the application
  basePath: '/infra-quiz',
  // Configure asset prefix to ensure all assets are served from the correct path
  assetPrefix: 'https://cdn.test.oddin.dev/infra-quiz',
  // Ensure trailing slashes are handled consistently
  trailingSlash: true,
  // Ensure output directory structure is correct
  distDir: 'out/infra-quiz',
}

module.exports = nextConfig 