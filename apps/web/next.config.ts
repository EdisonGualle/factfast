import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite importar desde @factfast/shared del workspace
  transpilePackages: ["@factfast/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
