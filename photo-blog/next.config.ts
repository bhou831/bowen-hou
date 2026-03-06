/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  watchOptions: {
    ignored: ['**/public/images/**'],
  },
}

module.exports = nextConfig