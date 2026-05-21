import type { NextConfig } from "next";

const nextConfig: any = {
  env: {
    ADDRESSABLE_API_KEY: process.env.ADDRESSABLE_API_KEY,
  },
};

export default nextConfig;
