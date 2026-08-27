import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Podrazumevani limit (1MB) je premali za slike profila (do 5MB, vidi
    // MAX_VELICINA_SLIKE u src/lib/validacija.ts).
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
