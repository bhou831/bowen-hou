/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    qualities: [90, 100],
  },
};

module.exports = nextConfig;
