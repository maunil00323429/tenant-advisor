/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        { source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*` }
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
