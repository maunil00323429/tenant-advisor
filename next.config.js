/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  rewrites: async () => [
    { source: "/api/:path*", destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : "/api/:path*" }
  ],
};

module.exports = nextConfig;
