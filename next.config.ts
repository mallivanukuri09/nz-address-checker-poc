import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ADDRESSABLE_API_KEY: process.env.ADDRESSABLE_API_KEY,
  },
};

export default nextConfig;
