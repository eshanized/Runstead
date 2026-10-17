/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/client/:path*',
        destination: '/demo/storefront-preview/client/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

