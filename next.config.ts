import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  reactCompiler: true,
};

export default nextConfig;
