/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // In production (AWS deploy), NEXT_PUBLIC_API_URL points to the API Gateway URL.
  // This rewrite proxies /api/* requests to that backend so the frontend and API
  // share the same origin, avoiding CORS issues from the browser.
  // On Vercel the env var is unset, so Vercel's native /api routing is used instead.
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
