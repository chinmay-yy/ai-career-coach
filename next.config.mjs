/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  // Disable ESLint during production builds (e.g., on Vercel) to avoid
  // "Cannot serialize key 'parse' in parser" errors from the build environment.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
