/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/demo/storefront-preview/client/:path*',
        destination: '/client/:path*',
        permanent: false,
      },
      {
        source: '/demo/storefront-preview/:path*',
        destination: '/storefront/:path*',
        permanent: false,
      },
      {
        source: '/demo/storefront-preview',
        destination: '/storefront',
        permanent: false,
      },
      {
        source: '/demo/:path*',
        destination: '/dashboard/:path*',
        permanent: false,
      },
      {
        source: '/demo',
        destination: '/dashboard/overview',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
